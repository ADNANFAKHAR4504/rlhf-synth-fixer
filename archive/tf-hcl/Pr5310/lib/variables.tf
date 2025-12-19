# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production"
  }
}

variable "environment_suffix" {
  description = "Suffix for resource naming (auto-generated if not provided)"
  type        = string
  default     = ""
}

variable "application" {
  description = "Application name"
  type        = string
  default     = "webhook-processor"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-webhooks"
}

# API Gateway Configuration
variable "api_throttle_burst_limit" {
  description = "API Gateway burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway steady-state rate limit"
  type        = number
  default     = 10000
}

variable "stripe_throttle_limit" {
  description = "Stripe-specific rate limit"
  type        = number
  default     = 2000
}

variable "paypal_throttle_limit" {
  description = "PayPal-specific rate limit"
  type        = number
  default     = 1500
}

variable "square_throttle_limit" {
  description = "Square-specific rate limit"
  type        = number
  default     = 1000
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "lambda_architecture" {
  description = "Lambda processor architecture (must be arm64)"
  type        = string
  default     = "arm64"

  validation {
    condition     = var.lambda_architecture == "arm64"
    error_message = "Lambda architecture must be arm64 for cost optimization"
  }
}

variable "validator_memory_size" {
  description = "Memory size for validator Lambda functions in MB"
  type        = number
  default     = 512
}

variable "validator_timeout" {
  description = "Timeout for validator Lambda functions in seconds"
  type        = number
  default     = 10
}

variable "processor_memory_size" {
  description = "Memory size for processor Lambda function in MB"
  type        = number
  default     = 1024
}

variable "processor_timeout" {
  description = "Timeout for processor Lambda function in seconds"
  type        = number
  default     = 30
}

variable "processor_reserved_concurrency" {
  description = "Reserved concurrency for processor function"
  type        = number
  default     = 100
}

variable "query_memory_size" {
  description = "Memory size for query Lambda function in MB"
  type        = number
  default     = 256
}

variable "query_timeout" {
  description = "Timeout for query Lambda function in seconds"
  type        = number
  default     = 5
}

# DynamoDB Configuration
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (must be PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = var.dynamodb_billing_mode == "PAY_PER_REQUEST"
    error_message = "DynamoDB billing mode must be PAY_PER_REQUEST (on-demand)"
  }
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery (must be true)"
  type        = bool
  default     = true

  validation {
    condition     = var.dynamodb_point_in_time_recovery == true
    error_message = "Point-in-time recovery must be enabled for data protection"
  }
}

variable "dynamodb_stream_enabled" {
  description = "Enable DynamoDB streams"
  type        = bool
  default     = true
}

# S3 Configuration
variable "s3_encryption_type" {
  description = "S3 encryption type (must be AES256 for SSE-S3)"
  type        = string
  default     = "AES256"

  validation {
    condition     = var.s3_encryption_type == "AES256"
    error_message = "S3 encryption must use AES256 (SSE-S3)"
  }
}

variable "raw_payload_retention_days" {
  description = "Number of days to retain raw webhook payloads"
  type        = number
  default     = 365
}

variable "raw_payload_glacier_days" {
  description = "Days before moving raw payloads to Glacier"
  type        = number
  default     = 90
}

variable "processed_logs_retention_days" {
  description = "Number of days to retain processed transaction logs"
  type        = number
  default     = 2555

  validation {
    condition     = var.processed_logs_retention_days >= 2555
    error_message = "Processed logs must be retained for 7 years (2555 days) for PCI compliance"
  }
}

variable "processed_logs_glacier_days" {
  description = "Days before moving processed logs to Glacier"
  type        = number
  default     = 180
}

# CloudWatch Configuration
variable "log_retention_validators" {
  description = "Log retention for validator functions in days"
  type        = number
  default     = 7
}

variable "log_retention_processor" {
  description = "Log retention for processor function in days"
  type        = number
  default     = 30
}

variable "log_retention_query" {
  description = "Log retention for query function in days"
  type        = number
  default     = 7
}

variable "log_retention_api_gateway" {
  description = "Log retention for API Gateway in days"
  type        = number
  default     = 14
}

# SQS Configuration
variable "dlq_message_retention_seconds" {
  description = "DLQ message retention in seconds"
  type        = number
  default     = 1209600
}

variable "dlq_visibility_timeout_seconds" {
  description = "DLQ visibility timeout in seconds"
  type        = number
  default     = 30
}

# Alarm Configuration
variable "alarm_sns_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops-team@example.com"
}

variable "lambda_error_threshold" {
  description = "Lambda error count threshold for alarms"
  type        = number
  default     = 10
}

variable "lambda_throttle_threshold" {
  description = "Lambda throttle count threshold for alarms"
  type        = number
  default     = 5
}

variable "api_4xx_error_rate_threshold" {
  description = "API Gateway 4xx error rate threshold percentage"
  type        = number
  default     = 5.0
}

variable "api_5xx_error_rate_threshold" {
  description = "API Gateway 5xx error rate threshold percentage"
  type        = number
  default     = 1.0
}

variable "api_p99_latency_threshold" {
  description = "API Gateway p99 latency threshold in milliseconds"
  type        = number
  default     = 2000
}

variable "dlq_message_count_threshold" {
  description = "DLQ message count threshold for alarms"
  type        = number
  default     = 10
}

# X-Ray Configuration
variable "xray_tracing_enabled" {
  description = "Enable X-Ray tracing (must be true)"
  type        = bool
  default     = true

  validation {
    condition     = var.xray_tracing_enabled == true
    error_message = "X-Ray tracing must be enabled for distributed tracing"
  }
}

variable "xray_sampling_rate" {
  description = "X-Ray sampling rate for successful requests"
  type        = number
  default     = 0.1

  validation {
    condition     = var.xray_sampling_rate >= 0 && var.xray_sampling_rate <= 1
    error_message = "X-Ray sampling rate must be between 0 and 1"
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
