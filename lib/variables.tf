# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "account_id" {
  description = "Current AWS account ID"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "Account ID must be a 12-digit number."
  }
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs that can assume roles"
  type        = list(string)
  default     = ["111111111111", "222222222222"]
  validation {
    condition = alltrue([
      for account_id in var.trusted_account_ids : can(regex("^[0-9]{12}$", account_id))
    ])
    error_message = "All account IDs must be 12-digit numbers."
  }
}

variable "log_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.log_bucket_name)) && length(var.log_bucket_name) >= 3 && length(var.log_bucket_name) <= 63
    error_message = "Bucket name must be 3-63 characters long, contain only lowercase letters, numbers, and hyphens, and start/end with alphanumeric characters."
  }
}

variable "app_s3_bucket_name" {
  description = "Name of the S3 bucket for application uploads"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.app_s3_bucket_name)) && length(var.app_s3_bucket_name) >= 3 && length(var.app_s3_bucket_name) <= 63
    error_message = "Bucket name must be 3-63 characters long, contain only lowercase letters, numbers, and hyphens, and start/end with alphanumeric characters."
  }
}

variable "notification_email" {
  description = "Email address for IAM change notifications"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
  }
}

variable "organization_id" {
  description = "AWS Organization ID for CloudTrail configuration"
  type        = string
  default     = ""
}

variable "cloudtrail_enable_data_events" {
  description = "Enable data events in CloudTrail"
  type        = bool
  default     = true
}

variable "cloudtrail_retention_days" {
  description = "Number of days to retain CloudWatch logs for CloudTrail"
  type        = number
  default     = 90
  validation {
    condition     = var.cloudtrail_retention_days >= 1 && var.cloudtrail_retention_days <= 3653
    error_message = "Retention days must be between 1 and 3653."
  }
}

variable "enable_sns_notifications" {
  description = "Enable SNS notifications for IAM changes"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
