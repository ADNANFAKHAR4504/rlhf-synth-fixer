# Lambda Module Variables

variable "function_name" {
  description = "Name of Lambda function"
  type        = string
}

variable "lambda_role_arn" {
  description = "ARN of Lambda execution role"
  type        = string
}

variable "primary_bucket_id" {
  description = "ID of primary S3 bucket"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of SNS topic"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Lambda VPC config"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs for Lambda"
  type        = list(string)
}

variable "eventbridge_rule_arn" {
  description = "ARN of EventBridge rule (optional, permission created after EventBridge module)"
  type        = string
  default     = ""
}

variable "timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

