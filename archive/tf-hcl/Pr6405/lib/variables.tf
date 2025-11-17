variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
  default     = "pr6405"
}

variable "compliance_rules" {
  description = "List of AWS Config managed rules to enable"
  type        = list(string)
  default = [
    "s3-bucket-public-read-prohibited",
    "s3-bucket-public-write-prohibited",
    "s3-bucket-server-side-encryption-enabled",
    "encrypted-volumes",
    "rds-encryption-enabled",
    "ec2-instance-no-public-ip",
    "iam-password-policy",
    "root-account-mfa-enabled"
  ]
}

variable "enable_auto_remediation" {
  description = "Enable automatic remediation for non-compliant resources"
  type        = bool
  default     = true
}

variable "sns_email_endpoint" {
  description = "Email address for compliance notifications"
  type        = string
  default     = ""
}

variable "config_snapshot_frequency" {
  description = "Frequency of configuration snapshots (set higher values to control Config snapshot costs)"
  type        = string
  default     = "Three_Hours"
  validation {
    condition     = contains(["One_Hour", "Three_Hours", "Six_Hours", "Twelve_Hours", "TwentyFour_Hours"], var.config_snapshot_frequency)
    error_message = "Snapshot frequency must be a valid AWS Config frequency value"
  }
}

variable "lambda_timeout" {
  description = "Timeout for Lambda function execution in seconds"
  type        = number
  default     = 60
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds"
  }
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda function"
  type        = number
  default     = 10
  validation {
    condition     = var.lambda_reserved_concurrent_executions >= -1 && var.lambda_reserved_concurrent_executions <= 1000
    error_message = "Reserved concurrent executions must be between -1 (unreserved) and 1000"
  }
}

variable "config_recorder_failure_mode" {
  description = "Behavior when Config recorder fails (continue or stop)"
  type        = string
  default     = "continue"
  validation {
    condition     = contains(["continue", "stop"], var.config_recorder_failure_mode)
    error_message = "Failure mode must be either 'continue' or 'stop'"
  }
}

variable "eventbridge_retry_attempts" {
  description = "Maximum retry attempts for EventBridge rule"
  type        = number
  default     = 3
  validation {
    condition     = var.eventbridge_retry_attempts >= 0 && var.eventbridge_retry_attempts <= 185
    error_message = "Retry attempts must be between 0 and 185"
  }
}

variable "eventbridge_maximum_event_age" {
  description = "Maximum age of EventBridge event in seconds"
  type        = number
  default     = 3600
  validation {
    condition     = var.eventbridge_maximum_event_age >= 60 && var.eventbridge_maximum_event_age <= 86400
    error_message = "Maximum event age must be between 60 and 86400 seconds (1 minute to 24 hours)"
  }
}
