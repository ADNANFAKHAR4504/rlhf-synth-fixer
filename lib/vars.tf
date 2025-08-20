########################
# Variables
########################

variable "region" {
  description = "AWS region for deployment (us-east-1 or eu-west-1)"
  type        = string

  validation {
    condition     = contains(["us-east-1", "eu-west-1"], var.region)
    error_message = "Region must be either 'us-east-1' or 'eu-west-1'."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming convention"
  type        = string
  default     = "secure-infra"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (prod or staging) for resource tagging and configuration"
  type        = string

  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "Environment must be either 'prod' or 'staging'."
  }
}

# VPC CIDR with enhanced validation
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB (specific IP ranges, never 0.0.0.0/0)"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

  validation {
    condition = alltrue([
      for cidr in var.allowed_cidr_blocks : !contains(["0.0.0.0/0"], cidr)
    ])
    error_message = "CIDR blocks must not include 0.0.0.0/0 for security compliance."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"

  validation {
    condition = contains([
      "t3.micro", "t3.small", "t3.medium", "t3.large",
      "m5.large", "m5.xlarge", "c5.large", "c5.xlarge"
    ], var.instance_type)
    error_message = "Instance type must be a valid EC2 instance type."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 12
    error_message = "Database password must be at least 12 characters long."
  }
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for SSH access"
  type        = string
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_period >= 7 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 7 and 35 days."
  }
}

variable "notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
  }
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instances in production"
  type        = bool
  default     = true
}

# Local values for consistent tagging and naming
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "ngwakoleslieelijah"
    CreatedDate = "2025-08-15"
    ProblemID   = "security_configuration_as_code_Terraform_HCL_h7js29a0kdr1"
  }

  name_prefix = "${var.project_name}-${var.environment}"
}
