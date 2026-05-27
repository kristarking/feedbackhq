variable "project"            {}
variable "environment"        {}
variable "vpc_id"             {}
variable "private_subnet_ids" { type = list(string) }
variable "db_name"            {}
variable "db_username"        {}
variable "allowed_sg_id"      {}
