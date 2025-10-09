# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "tap"
}

variable "environment_suffix" {
  description = "Environment suffix for resource names (e.g., dev, staging, prod)"
  type        = string
  default     = "prod-v2"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "TAP"
    Environment = "production"
    Owner      = "platform-team"
    CostCenter = "logistics"
  }
}

# SQS Configuration
variable "sqs_visibility_timeout_seconds" {
  description = "SQS visibility timeout in seconds. Must be greater than Lambda timeout"
  type        = number
  default     = 60
}

variable "sqs_message_retention_seconds" {
  description = "SQS message retention period in seconds"
  type        = number
  default     = 345600 # 4 days
}

variable "sqs_receive_wait_time_seconds" {
  description = "SQS long polling wait time in seconds"
  type        = number
  default     = 20
}

variable "sqs_max_receive_count" {
  description = "Maximum number of receives before sending to DLQ"
  type        = number
  default     = 5
}

variable "sqs_kms_master_key_id" {
  description = "KMS key ID for SQS encryption. If null, uses AWS managed key"
  type        = string
  default     = null
}

# Lambda Configuration
variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds. Must be less than SQS visibility timeout"
  type        = number
  default     = 20
}

variable "lambda_batch_size" {
  description = "Number of SQS messages to batch for Lambda"
  type        = number
  default     = 10
}

variable "lambda_maximum_batching_window_in_seconds" {
  description = "Maximum time to wait for batch collection"
  type        = number
  default     = 2
}

variable "lambda_log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 14
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda. -1 for unreserved"
  type        = number
  default     = -1
}

# DynamoDB Configuration
variable "dynamodb_ttl_enabled" {
  description = "Enable TTL on DynamoDB table"
  type        = bool
  default     = false
}

variable "dynamodb_ttl_attribute_name" {
  description = "Name of the TTL attribute in DynamoDB"
  type        = string
  default     = "expires_at"
}

# Alarm Configuration
variable "alarm_age_of_oldest_message_threshold" {
  description = "Threshold in seconds for oldest message age alarm"
  type        = number
  default     = 300 # 5 minutes
}

variable "alarm_messages_visible_threshold" {
  description = "Threshold for number of visible messages alarm"
  type        = number
  default     = 1000
}