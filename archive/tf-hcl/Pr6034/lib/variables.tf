variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "payment-api"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "prod"
}