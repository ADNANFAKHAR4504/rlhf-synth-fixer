variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "retail-api"
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 100
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit per second"
  type        = number
  default     = 50
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days (PCI-DSS requires minimum 365)"
  type        = number
  default     = 400

  validation {
    condition     = var.log_retention_days >= 365
    error_message = "PCI-DSS requires minimum 365 days log retention."
  }
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = true
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "waf_block_ip_list" {
  description = "List of IP ranges to block in WAF"
  type        = list(string)
  default     = []
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "platform-team@example.com"
}

