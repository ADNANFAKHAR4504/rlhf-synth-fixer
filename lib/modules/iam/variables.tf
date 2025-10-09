# IAM Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "lambda_log_group_arn" {
  description = "ARN of Lambda log group (optional, will use wildcard if not provided)"
  type        = string
  default     = ""
}

variable "primary_bucket_arn" {
  description = "ARN of primary S3 bucket"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of SNS topic"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

