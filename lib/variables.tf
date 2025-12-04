variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "fintech-payment"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to prevent conflicts"
  type        = string
  default     = "dev-004"
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
  default     = "DefaultP@ssw0rd123!"
}
