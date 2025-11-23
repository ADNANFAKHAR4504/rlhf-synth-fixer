variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|northwest|southwest)-[1-3]$", var.aws_region))
    error_message = "The aws_region must be a valid AWS region identifier."
  }
}

variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development", "dev", "prod", "stage"], var.environment)
    error_message = "Environment must be one of: production, staging, development, dev, prod, stage."
  }
}

variable "project_name" {
  description = "Project name for resource identification"
  type        = string
  default     = "ecommerce-catalog-api"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure deployment uniqueness"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix)) && length(var.environment_suffix) >= 3 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be 3-20 characters, containing only lowercase letters, numbers, and hyphens."
  }
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

# Instance Configuration
variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"

  validation {
    condition     = can(regex("^t3\\.(micro|small|medium|large|xlarge|2xlarge)$", var.instance_type))
    error_message = "Instance type must be a valid t3 family instance."
  }
}

# Auto Scaling Configuration
variable "asg_min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.asg_min_size >= 2
    error_message = "Minimum ASG size must be at least 2 for high availability."
  }
}

variable "asg_max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 10

  validation {
    condition     = var.asg_max_size >= 2 && var.asg_max_size <= 20
    error_message = "Maximum ASG size must be between 2 and 20."
  }
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.asg_desired_capacity >= 2
    error_message = "Desired capacity must be at least 2."
  }
}

# SSL Configuration
variable "domain_name" {
  description = "Domain name for ACM certificate"
  type        = string
  default     = "api.example.com"

  validation {
    condition     = can(regex("^[a-z0-9.-]+\\.[a-z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid FQDN."
  }
}

# Database Configuration
variable "rds_subnet_group_name" {
  description = "Name of existing RDS subnet group to reference"
  type        = string
  default     = "prod-db-subnet-group"

  validation {
    condition     = length(var.rds_subnet_group_name) > 0
    error_message = "RDS subnet group name cannot be empty."
  }
}
