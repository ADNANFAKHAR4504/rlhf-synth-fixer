variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple environments"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "approval_email" {
  description = "Email address for pipeline approval notifications"
  type        = string
  default     = "approvals@example.com"
}
