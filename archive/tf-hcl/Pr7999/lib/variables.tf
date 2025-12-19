# variables.tf

variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable parallel deployments (e.g., pr7999)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}
