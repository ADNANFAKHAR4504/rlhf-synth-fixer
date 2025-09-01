# Core region variable consumed by provider.tf
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = can(regex("^us-west-2$", var.aws_region))
    error_message = "Only us-west-2 is allowed for this production deployment."
  }
}

# Trusted CIDR blocks for network access control
# These should be your corporate networks, VPN endpoints, etc.
variable "trusted_cidrs" {
  description = "List of trusted CIDR blocks for network access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

  validation {
    condition = alltrue([
      for cidr in var.trusted_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All trusted_cidrs must be valid CIDR blocks."
  }
}

# VPC CIDR block - /16 provides 65,536 IP addresses
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && split("/", var.vpc_cidr)[1] == "16"
    error_message = "VPC CIDR must be a valid /16 CIDR block."
  }
}

# Environment identifier for resource naming
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Environment must contain only lowercase letters, numbers, and hyphens."
  }
}

# Project name for resource naming and organization
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "secure-foundation"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}
