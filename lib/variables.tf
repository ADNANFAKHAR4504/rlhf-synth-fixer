# General Variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
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

variable "project_name" {
  description = "Project name for resource tagging and naming"
  type        = string
  default     = "zero-trust-iam"
}

variable "owner" {
  description = "Owner or team responsible for the infrastructure"
  type        = string
  default     = "security-team"
}

# Network Security Variables
variable "allowed_ip_ranges" {
  description = "List of allowed IP CIDR ranges for corporate network and VPN access"
  type        = list(string)
  default = [
    "10.0.0.0/8",
    "172.16.0.0/12"
  ]
}

variable "vpc_endpoint_id" {
  description = "VPC endpoint ID for S3 access restrictions"
  type        = string
  default     = ""
}

# Time-Based Access Variables
variable "business_hours_start" {
  description = "Start of business hours in UTC (format: HH:MM:SS)"
  type        = string
  default     = "13:00:00"
}

variable "business_hours_end" {
  description = "End of business hours in UTC (format: HH:MM:SS)"
  type        = string
  default     = "22:00:00"
}

# Session Configuration Variables
variable "max_session_duration" {
  description = "Maximum session duration in seconds for IAM roles (max 14400 = 4 hours)"
  type        = number
  default     = 14400

  validation {
    condition     = var.max_session_duration >= 3600 && var.max_session_duration <= 14400
    error_message = "Maximum session duration must be between 3600 seconds (1 hour) and 14400 seconds (4 hours)."
  }
}

variable "external_session_duration" {
  description = "Session duration in seconds for external cross-account access (max 7200 = 2 hours)"
  type        = number
  default     = 7200

  validation {
    condition     = var.external_session_duration >= 3600 && var.external_session_duration <= 7200
    error_message = "External session duration must be between 3600 seconds (1 hour) and 7200 seconds (2 hours)."
  }
}

variable "mfa_max_age" {
  description = "Maximum age of MFA authentication in seconds"
  type        = number
  default     = 3600
}

# Cross-Account Access Variables
variable "external_account_ids" {
  description = "List of external AWS account IDs allowed for cross-account access"
  type        = list(string)
  default     = []
}

variable "external_id" {
  description = "External ID for cross-account role assumption (prevents confused deputy attacks)"
  type        = string
  default     = ""
  sensitive   = true
}

# Regional Restrictions Variables
variable "allowed_regions" {
  description = "List of AWS regions where operations are permitted"
  type        = list(string)
  default     = ["us-east-1"]
}

# Password Policy Variables
variable "password_min_length" {
  description = "Minimum password length for IAM users"
  type        = number
  default     = 14

  validation {
    condition     = var.password_min_length >= 14
    error_message = "Password minimum length must be at least 14 characters."
  }
}

variable "password_max_age" {
  description = "Maximum password age in days before expiration"
  type        = number
  default     = 90

  validation {
    condition     = var.password_max_age >= 1 && var.password_max_age <= 90
    error_message = "Password maximum age must be between 1 and 90 days."
  }
}

variable "password_reuse_prevention" {
  description = "Number of previous passwords that cannot be reused"
  type        = number
  default     = 12

  validation {
    condition     = var.password_reuse_prevention >= 12
    error_message = "Password reuse prevention must remember at least 12 passwords."
  }
}

# S3 Security Variables
variable "enable_s3_access_logging" {
  description = "Enable S3 access logging for financial data buckets"
  type        = bool
  default     = true
}

variable "s3_encryption_enabled" {
  description = "Enable KMS encryption for S3 buckets"
  type        = bool
  default     = true
}

# Monitoring Variables
variable "enable_iam_monitoring" {
  description = "Enable CloudWatch monitoring for IAM activities"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security-team@example.com"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90

  validation {
    condition     = var.log_retention_days >= 90
    error_message = "Log retention must be at least 90 days for compliance."
  }
}

# Time-Based Access Expiration Variables
variable "enable_time_based_access" {
  description = "Enable Lambda function for automatic time-based access expiration"
  type        = bool
  default     = true
}

variable "access_check_interval" {
  description = "Interval in minutes for checking and revoking expired access"
  type        = number
  default     = 60
}

# Service Role Variables
variable "enable_ec2_instance_role" {
  description = "Create IAM role for EC2 instances"
  type        = bool
  default     = true
}

variable "enable_lambda_execution_role" {
  description = "Create IAM role for Lambda functions"
  type        = bool
  default     = true
}

variable "enable_rds_monitoring_role" {
  description = "Create IAM role for RDS Enhanced Monitoring"
  type        = bool
  default     = true
}

# Financial Data Bucket Variables
variable "financial_data_bucket_name" {
  description = "Name of the S3 bucket for financial data storage (will be suffixed with environment)"
  type        = string
  default     = "financial-data"
}

variable "enable_mfa_delete" {
  description = "Require MFA for S3 object deletion operations (must be enabled manually via AWS CLI with MFA token after deployment)"
  type        = bool
  default     = false
}
