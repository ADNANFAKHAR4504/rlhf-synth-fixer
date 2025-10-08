# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "application_count" {
  description = "Number of applications"
  type        = number
  default     = 12
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

variable "firehose_buffer_size" {
  description = "Firehose buffer size in MB (minimum 64 for dynamic partitioning)"
  type        = number
  default     = 64
}

variable "firehose_buffer_interval" {
  description = "Firehose buffer interval in seconds"
  type        = number
  default     = 60
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "centralized-logging"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "cross_account_ids" {
  description = "List of AWS account IDs for cross-account access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "CentralizedLogging"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
