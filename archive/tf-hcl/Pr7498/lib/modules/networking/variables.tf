# modules/networking/variables.tf
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters and numbers."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) == 3
    error_message = "Exactly 3 availability zones must be specified."
  }
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
