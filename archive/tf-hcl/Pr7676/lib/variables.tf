variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent collisions"
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "environment_suffix must contain only lowercase letters, numbers, and hyphens"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (Amazon Linux 2 recommended)"
  type        = string
  default     = "" # Will use latest Amazon Linux 2 if not specified

  validation {
    condition     = var.ami_id == "" || can(regex("^ami-", var.ami_id))
    error_message = "ami_id must be a valid AMI ID starting with 'ami-' or empty string"
  }
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS listener. If not provided, HTTPS listener will be skipped."
  type        = string
  default     = ""

  validation {
    condition     = var.acm_certificate_arn == "" || can(regex("^arn:aws:acm:", var.acm_certificate_arn))
    error_message = "acm_certificate_arn must be a valid ACM certificate ARN or empty string"
  }
}

variable "db_username" {
  description = "Master username for RDS PostgreSQL"
  type        = string
  default     = "dbadmin"
  sensitive   = true

  validation {
    condition     = length(var.db_username) >= 1 && length(var.db_username) <= 16
    error_message = "db_username must be between 1 and 16 characters"
  }
}

variable "db_password" {
  description = "Master password for RDS PostgreSQL"
  type        = string
  default     = "ChangeMe123!"
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "db_password must be at least 8 characters"
  }
}

variable "db_max_connections" {
  description = "Maximum number of database connections for alarm threshold"
  type        = number
  default     = 100
}
