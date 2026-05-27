variable "project"              {}
variable "environment"          {}
variable "vpc_id"               {}
variable "private_subnet_ids"   { type = list(string) }
variable "public_subnet_ids"    { type = list(string) }
variable "alb_sg_id"            {}
variable "frontend_target_arn"  {}
variable "backend_target_arn"   {}
variable "frontend_image"       {}
variable "backend_image"        {}
variable "execution_role_arn"   {}
variable "task_role_arn"        {}
variable "db_host"              {}
variable "redis_host"           {}
variable "secrets_arn"          {}
