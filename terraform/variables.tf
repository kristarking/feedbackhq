variable "aws_region"      { default = "us-east-1" }
variable "project"         { default = "feedbackhq" }
variable "environment"     { default = "prod" }
variable "vpc_cidr"        { default = "10.0.0.0/16" }
variable "db_name"         { default = "feedbackhq" }
variable "db_username"     { default = "feedbackhq_user" }
variable "certificate_arn" { description = "ACM certificate ARN for HTTPS" }
