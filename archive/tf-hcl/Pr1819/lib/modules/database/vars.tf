variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "The IDs of the private subnets"
}

variable "rds_sg_id" {
  type        = string
  description = "The ID of the RDS security group"
}

variable "db_username" {
  type        = string
  description = "The username for the RDS instance"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "The password for the RDS instance"
  sensitive   = true
}
