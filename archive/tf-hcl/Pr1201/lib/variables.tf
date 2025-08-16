# variables.tf

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "SecureInfrastructure"
}

variable "notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "security@company.com"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev"
}