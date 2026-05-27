variable "project"            {}
variable "environment"        {}
variable "vpc_id"             {}
variable "private_subnet_ids" { type = list(string) }
variable "allowed_sg_id"      {}
