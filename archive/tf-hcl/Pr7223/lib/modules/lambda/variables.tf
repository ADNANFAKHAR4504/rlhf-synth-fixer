variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "s3_bucket_arn" {
  description = "ARN of S3 bucket for Lambda access"
  type        = string
}

variable "bucket_name" {
  description = "Name of S3 bucket"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
