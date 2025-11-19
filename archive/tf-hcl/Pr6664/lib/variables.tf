# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "logging_account_id" {
  description = "AWS account ID for centralized logging"
  type        = string
  default     = "123456789012"
}

variable "security_notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "security-team@example.com"
}

variable "api_key_placeholder" {
  description = "Placeholder API key for payment gateway"
  type        = string
  default     = "placeholder-api-key"
  sensitive   = true
}