variable "aws_region" {
  description = "AWS region for backend resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "multi-env-infra"
}

variable "environment_suffix" {
  description = "Unique suffix for environment resources"
  type        = string
}
