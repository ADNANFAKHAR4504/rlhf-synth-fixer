variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "vpc_id" {
  type        = string
  description = "The ID of the VPC"
}

variable "private_route_table_ids" {
  type        = list(string)
  description = "The IDs of the private route tables"
}

variable "account_id" {
  type        = string
  description = "The ID of the AWS account"
}
