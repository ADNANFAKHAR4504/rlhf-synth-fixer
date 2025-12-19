variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region for global table replica"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "KMS key ARN for primary region encryption"
  type        = string
}

variable "secondary_kms_key_arn" {
  description = "KMS key ARN for secondary region encryption"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
}