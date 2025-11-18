variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to ensure uniqueness"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "VPC ID for VPC endpoints"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "Subnet IDs for VPC endpoints"
  type        = list(string)
  default     = []
}

variable "organization_id" {
  description = "AWS Organization ID for SCPs"
  type        = string
  default     = ""
}

variable "audit_account_id" {
  description = "Audit account ID for AWS Config aggregation"
  type        = string
  default     = ""
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7

  validation {
    condition     = var.kms_key_deletion_window == 7
    error_message = "KMS key deletion window must be exactly 7 days."
  }
}

variable "secret_rotation_days" {
  description = "Number of days between secret rotations"
  type        = number
  default     = 30
}

variable "iam_session_duration_seconds" {
  description = "Maximum session duration for IAM roles in seconds"
  type        = number
  default     = 3600

  validation {
    condition     = var.iam_session_duration_seconds == 3600
    error_message = "IAM session duration must be exactly 1 hour (3600 seconds)."
  }
}

variable "cloudwatch_logs_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90
}

variable "data_classifications" {
  description = "Data classification tags to apply to resources"
  type        = list(string)
  default     = ["PII", "Confidential", "Public"]
}
