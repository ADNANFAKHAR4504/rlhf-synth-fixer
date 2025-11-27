variable "aws_region" {
  description = "AWS region to deploy into. Provide via -var or TF_VAR_aws_region environment variable. No hardcoded defaults to ensure cross-account/region executability."
  type        = string
}

variable "environment" {
  description = "Deployment environment suffix (e.g., dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used in resource naming"
  type        = string
  default     = "webhook-processor"
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
  default     = "fintech-ops"
}

variable "lambda_configs" {
  description = "Lambda function memory/timeout configuration"
  type = map(object({
    memory_size = number
    timeout     = number
  }))
  default = {
    webhook_receiver      = { memory_size = 512, timeout = 60 }
    payload_validator     = { memory_size = 256, timeout = 30 }
    transaction_processor = { memory_size = 1024, timeout = 120 }
  }
}

variable "ssm_prefix" {
  description = "SSM Parameter Store prefix/path for sensitive values"
  type        = string
  default     = "/webhook-processor"
}

variable "notification_emails" {
  description = "List of email addresses to subscribe to alert SNS topic"
  type        = list(string)
  default     = []
}
