# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "environment_suffix" {
  description = "Environment suffix to ensure unique resource names"
  type        = string
  default     = ""
}

variable "service_name" {
  description = "Service name for tagging"
  type        = string
  default     = "OrderProcessing"
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 55
}

variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 60
}

variable "sqs_message_retention_days" {
  description = "SQS message retention period in days"
  type        = number
  default     = 4
}

variable "dlq_message_retention_days" {
  description = "DLQ message retention period in days"
  type        = number
  default     = 14
}

variable "max_receive_count" {
  description = "Maximum receive count before sending to DLQ"
  type        = number
  default     = 3
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
  default     = 10
}

variable "sqs_batch_size" {
  description = "Batch size for SQS to Lambda event source mapping"
  type        = number
  default     = 5
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "dlq_alarm_threshold" {
  description = "DLQ message count threshold for CloudWatch alarm"
  type        = number
  default     = 5
}