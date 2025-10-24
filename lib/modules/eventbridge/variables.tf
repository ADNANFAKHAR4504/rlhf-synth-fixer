variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "consistency_checker_arn" {
  description = "Consistency checker Lambda ARN"
  type        = string
}

variable "rollback_arn" {
  description = "Rollback Lambda ARN"
  type        = string
}

variable "sns_alert_topic_arn" {
  description = "SNS alert topic ARN"
  type        = string
}

variable "retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
