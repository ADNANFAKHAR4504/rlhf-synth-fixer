variable "aws_region" {
  description = "The AWS region to deploy the infrastructure"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "logging-analytics"
}

variable "log_bucket_name" {
  description = "The name of the S3 bucket for log storage"
  type        = string
  default     = "centralized-logging-storage"
}

variable "log_types" {
  description = "Types of logs to collect and process"
  type        = list(string)
  default     = ["application", "system", "security", "performance"]
}

variable "retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 365
}

variable "firehose_buffer_size" {
  description = "Firehose buffer size in MB"
  type        = number
  default     = 64
}

variable "firehose_buffer_interval" {
  description = "Firehose buffer interval in seconds"
  type        = number
  default     = 60
}

variable "lambda_memory_size" {
  description = "Lambda memory allocation"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 120
}

variable "glue_database_name" {
  description = "Name of the Glue database"
  type        = string
  default     = "logs_analytics_db"
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "govardhan.y@turing.com"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (typically PR number or environment identifier)"
  type        = string
  default     = ""
}
