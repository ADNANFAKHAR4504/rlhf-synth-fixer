variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "fintech-payment"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to prevent conflicts"
  type        = string
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
}
