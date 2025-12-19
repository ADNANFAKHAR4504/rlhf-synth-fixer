# General Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "legal-docs"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming (e.g., pr4798, synth123). Reads from ENVIRONMENT_SUFFIX env variable if not provided."
  type        = string
  default     = ""

  validation {
    condition     = var.environment_suffix == "" || can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

# S3 Bucket Configuration
variable "primary_bucket_name" {
  description = "Name for the primary document storage bucket (leave empty for auto-generated)"
  type        = string
  default     = ""

  validation {
    condition     = var.primary_bucket_name == "" || can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.primary_bucket_name))
    error_message = "Bucket name must be 3-63 characters, lowercase letters, numbers, and hyphens only."
  }
}

variable "audit_bucket_name" {
  description = "Name for the audit logs bucket (leave empty for auto-generated)"
  type        = string
  default     = ""
}

variable "reporting_bucket_name" {
  description = "Name for the reporting bucket (leave empty for auto-generated)"
  type        = string
  default     = ""
}

# Object Lock and Retention
variable "enable_object_lock" {
  description = "Enable S3 Object Lock on primary bucket (requires versioning, cannot be disabled after creation)"
  type        = bool
  default     = true
}

variable "object_lock_retention_days" {
  description = "Default retention period in days for Object Lock (compliance mode)"
  type        = number
  default     = 90

  validation {
    condition     = var.object_lock_retention_days >= 1 && var.object_lock_retention_days <= 36500
    error_message = "Retention days must be between 1 and 36,500 (100 years)."
  }
}

variable "legal_retention_years" {
  description = "Legal retention period in years for document versions"
  type        = number
  default     = 7

  validation {
    condition     = var.legal_retention_years >= 1 && var.legal_retention_years <= 100
    error_message = "Legal retention years must be between 1 and 100."
  }
}

# MFA Delete
variable "enable_mfa_delete" {
  description = "Enable MFA Delete protection (requires root account and manual setup)"
  type        = bool
  default     = false
}

# Lifecycle Policies
variable "transition_to_intelligent_tiering_days" {
  description = "Days before transitioning current versions to Intelligent-Tiering"
  type        = number
  default     = 30

  validation {
    condition     = var.transition_to_intelligent_tiering_days >= 0
    error_message = "Transition days must be non-negative."
  }
}

variable "transition_noncurrent_to_glacier_days" {
  description = "Days before transitioning old versions to Glacier"
  type        = number
  default     = 90
}

variable "abort_incomplete_uploads_days" {
  description = "Days before aborting incomplete multipart uploads"
  type        = number
  default     = 7
}

# Encryption
variable "enable_separate_audit_kms_key" {
  description = "Create separate KMS key for audit logs (recommended for compliance)"
  type        = bool
  default     = true
}

variable "kms_key_rotation_enabled" {
  description = "Enable automatic KMS key rotation"
  type        = bool
  default     = true
}

# Access Control
variable "restrict_to_vpc_endpoint" {
  description = "Restrict bucket access to specific VPC endpoint (leave empty for no restriction)"
  type        = string
  default     = ""
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs allowed to access the bucket"
  type        = list(string)
  default     = []
}

# CloudTrail
variable "enable_cloudtrail" {
  description = "Enable CloudTrail logging for S3 bucket"
  type        = bool
  default     = true
}

variable "cloudtrail_cloudwatch_logs_enabled" {
  description = "Send CloudTrail logs to CloudWatch Logs"
  type        = bool
  default     = true
}

variable "cloudtrail_log_retention_days" {
  description = "CloudWatch Logs retention period for CloudTrail logs"
  type        = number
  default     = 90
}

# S3 Access Logging
variable "enable_s3_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = true
}

# Monitoring and Alarms
variable "failed_requests_threshold" {
  description = "Threshold for failed requests alarm"
  type        = number
  default     = 50
}

variable "unexpected_delete_threshold" {
  description = "Threshold for unexpected delete operations alarm"
  type        = number
  default     = 5
}

variable "high_download_volume_threshold_gb" {
  description = "Threshold for high download volume alarm (in GB)"
  type        = number
  default     = 100
}

variable "alarm_email_endpoints" {
  description = "List of email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

# Compliance Lambda
variable "compliance_check_schedule" {
  description = "CloudWatch Events schedule expression for compliance checks (default: daily at 2 AM UTC)"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

# Reporting Lambda
variable "reporting_schedule" {
  description = "CloudWatch Events schedule expression for monthly reports (default: 1st of month at 3 AM UTC)"
  type        = string
  default     = "cron(0 3 1 * ? *)"
}

variable "enable_ses_reporting" {
  description = "Enable SES email notifications for monthly reports"
  type        = bool
  default     = false
}

variable "ses_sender_email" {
  description = "SES verified sender email address for reports"
  type        = string
  default     = ""
}

variable "ses_recipient_emails" {
  description = "List of recipient email addresses for monthly reports"
  type        = list(string)
  default     = []
}

# Optional Features
variable "enable_s3_inventory" {
  description = "Enable S3 Inventory for detailed object reports"
  type        = bool
  default     = true
}

variable "s3_inventory_schedule" {
  description = "S3 Inventory frequency (Daily or Weekly)"
  type        = string
  default     = "Weekly"

  validation {
    condition     = contains(["Daily", "Weekly"], var.s3_inventory_schedule)
    error_message = "S3 Inventory schedule must be Daily or Weekly."
  }
}

variable "enable_cloudwatch_dashboard" {
  description = "Create CloudWatch dashboard for storage metrics"
  type        = bool
  default     = true
}

# Lambda Configuration
variable "compliance_lambda_memory" {
  description = "Memory allocation for compliance Lambda function (MB)"
  type        = number
  default     = 256
}

variable "compliance_lambda_timeout" {
  description = "Timeout for compliance Lambda function (seconds)"
  type        = number
  default     = 300
}

variable "reporting_lambda_memory" {
  description = "Memory allocation for reporting Lambda function (MB)"
  type        = number
  default     = 512
}

variable "reporting_lambda_timeout" {
  description = "Timeout for reporting Lambda function (seconds)"
  type        = number
  default     = 600
}

# S3 Transfer Acceleration
variable "enable_transfer_acceleration" {
  description = "Enable S3 Transfer Acceleration for faster uploads from global locations"
  type        = bool
  default     = true
}

# Cross-Region Replication
variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for disaster recovery"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "AWS region for replication bucket (e.g., us-west-2)"
  type        = string
  default     = "us-west-2"
}

# AWS Backup
variable "enable_aws_backup" {
  description = "Enable AWS Backup for automated backup management"
  type        = bool
  default     = true
}

variable "backup_schedule" {
  description = "Cron expression for backup schedule (default: daily at 1 AM UTC)"
  type        = string
  default     = "cron(0 1 * * ? *)"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups (must be at least 90 days after cold storage)"
  type        = number
  default     = 120

  validation {
    condition     = var.backup_retention_days >= 97
    error_message = "Backup retention must be at least 97 days (minimum 90 days after cold storage transition)."
  }
}

variable "backup_cold_storage_after_days" {
  description = "Number of days before moving backups to cold storage (must be at least 90 days before deletion)"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_cold_storage_after_days >= 7
    error_message = "Cold storage transition must be at least 7 days after backup creation."
  }
}

# Tagging
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
