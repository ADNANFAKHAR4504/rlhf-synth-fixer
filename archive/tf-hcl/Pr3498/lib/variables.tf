variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "SecurityTeam"
}

variable "security_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "security@example.com"
}

variable "cloudtrail_bucket_prefix" {
  description = "Prefix for CloudTrail S3 bucket name"
  type        = string
  default     = "security-cloudtrail-logs"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 180
}

variable "glacier_transition_days" {
  description = "Days before transitioning logs to Glacier"
  type        = number
  default     = 90
}

variable "enable_mfa_delete" {
  description = "Enable MFA delete for S3 bucket"
  type        = bool
  default     = true
}

variable "environment_suffix" {
  description = "Suffix to append to resource names to avoid conflicts"
  type        = string
  default     = ""
}

locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "synth78029461"

  common_tags = {
    Environment = var.environment
    Purpose     = "Security Monitoring"
    Owner       = var.owner
    ManagedBy   = "Terraform"
  }
}