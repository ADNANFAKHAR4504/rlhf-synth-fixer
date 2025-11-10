# variables.tf

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid collisions"
  type        = string
}

variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "partner_region" {
  description = "Partner VPC region for cross-region peering"
  type        = string
  default     = "us-east-2"
}

variable "partner_account_id" {
  description = "AWS Account ID of the partner (for cross-account peering)"
  type        = string
  default     = "" # Empty for same-account peering
}

variable "partner_vpc_id" {
  description = "VPC ID of the partner VPC (optional, will be looked up via data source if not provided)"
  type        = string
  default     = ""
}

variable "enable_dns_resolution" {
  description = "Enable DNS resolution across the VPC peering connection"
  type        = bool
  default     = true
}

variable "flow_log_retention_days" {
  description = "Retention period for VPC Flow Logs"
  type        = number
  default     = 7
}

variable "alarm_email_endpoint" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops-team@example.com"
}