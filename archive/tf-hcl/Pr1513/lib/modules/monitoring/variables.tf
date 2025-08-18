variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "cloudtrail_s3_bucket" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
