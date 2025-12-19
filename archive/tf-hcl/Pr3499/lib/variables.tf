variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "expense-tracker"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "synth43287915"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 120
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 1024
}

variable "max_receipt_size_mb" {
  description = "Maximum receipt file size in MB"
  type        = number
  default     = 10
}

variable "notification_email" {
  description = "Email address for completion notifications"
  type        = string
  default     = "admin@example.com"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Application = "ExpenseTracking"
    CostCenter  = "Engineering"
  }
}