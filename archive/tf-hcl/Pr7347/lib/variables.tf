# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev11"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "environment_suffix must contain only lowercase letters, numbers, and hyphens"
  }
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "kinesis_shard_count" {
  description = "Number of shards for Kinesis Data Stream"
  type        = number
  default     = 5

  validation {
    condition     = var.kinesis_shard_count > 0 && var.kinesis_shard_count <= 100
    error_message = "Kinesis shard count must be between 1 and 100"
  }
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30
}

variable "alarm_email_endpoint" {
  description = "Email address for alarm notifications"
  type        = string
  default     = "ops-team@example.com"
}

variable "xray_sampling_rate" {
  description = "X-Ray sampling rate (1.0 = 100%)"
  type        = number
  default     = 1.0

  validation {
    condition     = var.xray_sampling_rate >= 0.0 && var.xray_sampling_rate <= 1.0
    error_message = "X-Ray sampling rate must be between 0.0 and 1.0"
  }
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda function in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}