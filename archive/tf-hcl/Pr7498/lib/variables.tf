# variables.tf
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{6,12}$", var.environment_suffix))
    error_message = "Environment suffix must be 6-12 lowercase alphanumeric characters."
  }
}

variable "cost_center" {
  description = "Cost center tag for billing"
  type        = string

  validation {
    condition     = length(var.cost_center) > 0
    error_message = "Cost center must not be empty."
  }
}

# Networking variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ALB variables
variable "health_check_path" {
  description = "Health check path for ALB target group"
  type        = string
  default     = "/health"
}

# ECS variables
variable "container_image" {
  description = "Docker container image"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 80
}

variable "task_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

# RDS variables
variable "database_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_master_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_instance_count" {
  description = "Number of RDS instances"
  type        = number
  default     = 2
}
