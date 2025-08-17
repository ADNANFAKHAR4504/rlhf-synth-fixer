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

variable "config_s3_bucket" {
  description = "S3 bucket name for AWS Config logs"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
}

variable "enable_organization_aggregator" {
  description = "Enable AWS Config organization aggregator"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
