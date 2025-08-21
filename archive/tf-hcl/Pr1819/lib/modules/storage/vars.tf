variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
}
