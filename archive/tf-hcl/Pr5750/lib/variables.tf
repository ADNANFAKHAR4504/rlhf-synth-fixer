variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., -dev, -staging, -prod, -pr123)"
  type        = string
  default     = "-dev"

  validation {
    condition     = can(regex("^-[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must start with a hyphen and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"

  validation {
    condition     = can(regex("^t3\\.(micro|small|medium|large)$", var.instance_type))
    error_message = "Instance type must be a valid t3 instance type (micro, small, medium, or large)."
  }
}

variable "asg_min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 1

  validation {
    condition     = var.asg_min_size >= 1 && var.asg_min_size <= 10
    error_message = "ASG min size must be between 1 and 10."
  }
}

variable "asg_max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 4

  validation {
    condition     = var.asg_max_size >= 1 && var.asg_max_size <= 20
    error_message = "ASG max size must be between 1 and 20."
  }
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.asg_desired_capacity >= 1 && var.asg_desired_capacity <= 20
    error_message = "ASG desired capacity must be between 1 and 20."
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"

  validation {
    condition     = can(regex("^db\\.t3\\.(micro|small|medium|large)$", var.db_instance_class))
    error_message = "DB instance class must be a valid db.t3 instance type."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true

  validation {
    condition     = length(var.db_username) >= 1 && length(var.db_username) <= 16
    error_message = "DB username must be between 1 and 16 characters."
  }
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "DB password must be at least 8 characters long."
  }
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = false
}
