variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC."
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
}

variable "private_route_table_ids" {
  description = "A list of private route table IDs."
  type        = list(string)
}
