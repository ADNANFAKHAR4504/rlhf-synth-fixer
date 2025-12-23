variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "corp"
}

variable "notification_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = "admin@company.com"
}

variable "enable_macie" {
  description = "Enable Amazon Macie for data discovery"
  type        = bool
  default     = false
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false
}

variable "environment_suffix" {
  description = "Suffix to append to all resource names for uniqueness"
  type        = string
  default     = ""
}