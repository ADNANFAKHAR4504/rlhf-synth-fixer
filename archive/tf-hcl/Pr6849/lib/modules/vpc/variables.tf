variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or secondary)"
  type        = string
  validation {
    condition     = contains(["primary", "secondary"], var.region_name)
    error_message = "Region name must be 'primary' or 'secondary'"
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block"
  }
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  validation {
    condition     = length(var.private_subnets) == 3
    error_message = "Exactly 3 private subnets are required for HA"
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) == 3
    error_message = "Exactly 3 availability zones are required"
  }
}
