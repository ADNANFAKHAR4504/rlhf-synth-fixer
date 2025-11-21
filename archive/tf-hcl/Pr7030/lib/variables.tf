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
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev7"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-processing"
}

variable "alert_email_addresses" {
  description = "Email addresses for SNS alerts"
  type        = list(string)
  default     = ["ops@example.com"]
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID (required for prod)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for Route53 records"
  type        = string
  default     = ""
}
