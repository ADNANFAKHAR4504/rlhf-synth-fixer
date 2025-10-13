variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "subscription-mgmt"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to avoid conflicts"
  type        = string
  default     = ""
}

variable "sender_email" {
  description = "Verified SES sender email address"
  type        = string
  default     = "noreply@example.com"
}

variable "payment_gateway_api_key" {
  description = "Payment gateway API key"
  type        = string
  sensitive   = true
  default     = "placeholder-api-key"
}
