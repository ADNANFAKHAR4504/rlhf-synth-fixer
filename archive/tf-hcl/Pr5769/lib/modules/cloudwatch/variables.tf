variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "retention_days" {
  description = "Log retention period in days"
  type        = number
}

variable "kms_key_arn" {
  description = "KMS key ARN for log encryption"
  type        = string
}
