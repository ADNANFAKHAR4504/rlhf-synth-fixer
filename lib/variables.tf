variable "environment_suffix" {
  description = "Environment suffix for resource naming and identification"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "primary_region" {
  description = "Primary AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for KMS replica keys"
  type        = string
  default     = "us-west-2"
}

variable "organization_name" {
  description = "Name of the AWS Organization"
  type        = string
}

variable "organizational_units" {
  description = "List of organizational unit names to create"
  type        = list(string)
  default = [
    "Security",
    "Production",
    "Development"
  ]
}

variable "kms_key_rotation_days" {
  description = "Number of days between KMS key rotations"
  type        = number
  default     = 365
  validation {
    condition     = var.kms_key_rotation_days >= 90 && var.kms_key_rotation_days <= 2560
    error_message = "KMS key rotation must be between 90 and 2560 days."
  }
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_log_retention_days)
    error_message = "Invalid retention period. Must be one of the valid CloudWatch retention values."
  }
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail logging for organization"
  type        = bool
  default     = true
}

variable "trusted_account_ids" {
  description = "List of trusted AWS account IDs for cross-account access"
  type        = list(string)
  validation {
    condition = alltrue([
      for account_id in var.trusted_account_ids : can(regex("^[0-9]{12}$", account_id))
    ])
    error_message = "All account IDs must be 12-digit numbers."
  }
}

variable "mfa_device_arn" {
  description = "ARN of the MFA device for cross-account access (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "enable_config" {
  description = "Enable AWS Config for compliance checking"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    CreatedBy   = "terraform"
    Environment = "production"
  }
}

variable "config_conformance_pack_name" {
  description = "Name of the AWS Config Conformance Pack"
  type        = string
  default     = "security-conformance-pack"
}
