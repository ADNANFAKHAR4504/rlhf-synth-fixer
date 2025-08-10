variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  
  validation {
    condition     = length(var.environment) > 0
    error_message = "Environment name cannot be empty."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnets" { 
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  
  validation {
    condition     = length(var.public_subnets) > 0
    error_message = "At least one public subnet must be specified."
  }
}

variable "private_subnets" { 
  description = "List of private subnet CIDR blocks"  
  type        = list(string)
  
  validation {
    condition     = length(var.private_subnets) > 0
    error_message = "At least one private subnet must be specified."
  }
}
