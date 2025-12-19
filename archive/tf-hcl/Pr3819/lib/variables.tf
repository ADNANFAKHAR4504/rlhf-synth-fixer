variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "feedback-system"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "athena_query_result_retention_days" {
  description = "Days to retain Athena query results"
  type        = number
  default     = 30
}

variable "environment_suffix" {
  description = "Suffix to append to all resource names for isolation (e.g., synth51682039 or pr123)"
  type        = string
  default     = "synth51682039"
}
