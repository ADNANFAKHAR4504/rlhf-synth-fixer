variable "org_prefix" {
  description = "Organization prefix for resource naming"
  type        = string
  validation {
    condition     = length(var.org_prefix) <= 10
    error_message = "Organization prefix must be 10 characters or less."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be prod, staging, or dev."
  }
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters and numbers."
  }
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
}

variable "allowed_ingress_cidrs" {
  description = "Organization-approved CIDR blocks for ingress"
  type        = list(string)
}

variable "allowed_ports" {
  description = "Allowed ports for ingress"
  type        = list(number)
}

variable "flow_logs_retention_days" {
  description = "CloudWatch Logs retention period for VPC Flow Logs"
  type        = number
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
}