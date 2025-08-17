variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project used for resource naming"
  type        = string
  default     = "ProjectName"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "environment_suffix" {
  description = "Suffix for environment-specific resource naming"
  type        = string
  default     = "synthtrainr839"
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access resources"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production
}

variable "deployment_id" {
  description = "Unique deployment identifier to prevent resource name conflicts"
  type        = string
  default     = null
}