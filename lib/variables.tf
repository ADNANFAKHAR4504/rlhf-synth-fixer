variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs for cross-account access"
  type        = list(string)
  default     = []
}

variable "external_id" {
  description = "External ID for cross-account role assumption"
  type        = string
  default     = "secureApp-external-id"
  sensitive   = true
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout <= 30
    error_message = "Lambda timeout must not exceed 30 seconds."
  }
}

variable "lambda_environment_variables" {
  description = "Environment variables for Lambda function"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "name_prefix" {
  description = "Prefix used for naming resources (logical names). Lowercasing may be applied where required by AWS (e.g., S3 buckets)."
  type        = string
  default     = "secureApp"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}
