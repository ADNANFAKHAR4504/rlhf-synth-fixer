variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 3653 # 10 years
}

variable "s3_retention_years" {
  description = "S3 Object Lock retention in years"
  type        = number
  default     = 10
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "audit-logging"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "daily_event_count" {
  description = "Expected daily event count"
  type        = number
  default     = 18700
}
