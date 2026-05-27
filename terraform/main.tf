terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random",    version = "~> 3.6" }
  }
  backend "s3" {
    bucket = "feedbackhq-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags { tags = { Project = "feedbackhq", Environment = var.environment, ManagedBy = "terraform" } }
}

module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  environment = var.environment
  cidr        = var.vpc_cidr
}

module "ecr" {
  source      = "./modules/ecr"
  project     = var.project
  environment = var.environment
}

module "alb" {
  source            = "./modules/alb"
  project           = var.project
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
}

module "rds" {
  source              = "./modules/rds"
  project             = var.project
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  db_name             = var.db_name
  db_username         = var.db_username
  allowed_sg_id       = module.ecs.ecs_tasks_sg_id
}

module "elasticache" {
  source             = "./modules/elasticache"
  project            = var.project
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  allowed_sg_id      = module.ecs.ecs_tasks_sg_id
}

module "iam" {
  source      = "./modules/iam"
  project     = var.project
  environment = var.environment
}

module "ecs" {
  source               = "./modules/ecs"
  project              = var.project
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  public_subnet_ids    = module.vpc.public_subnet_ids
  alb_sg_id            = module.alb.alb_sg_id
  frontend_target_arn  = module.alb.frontend_target_group_arn
  backend_target_arn   = module.alb.backend_target_group_arn
  frontend_image       = "${module.ecr.frontend_url}:latest"
  backend_image        = "${module.ecr.backend_url}:latest"
  execution_role_arn   = module.iam.ecs_execution_role_arn
  task_role_arn        = module.iam.ecs_task_role_arn
  db_host              = module.rds.endpoint
  redis_host           = module.elasticache.endpoint
  secrets_arn          = module.rds.secrets_arn
}
