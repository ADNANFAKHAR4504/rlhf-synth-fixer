variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
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
  description = "Frequency of configuration snapshots"
  type        = string
  default     = "One_Hour"
  validation {
    condition     = contains(["One_Hour", "Three_Hours", "Six_Hours", "Twelve_Hours", "TwentyFour_Hours"], var.config_snapshot_frequency)
    error_message = "Snapshot frequency must be a valid AWS Config frequency value"
  }
}
