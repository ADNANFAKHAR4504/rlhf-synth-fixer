variable "environment_suffix" {
  description = "Unique suffix for resource names to avoid conflicts"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be between 1 and 20 characters"
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-west-2", "eu-west-1"], var.aws_region)
    error_message = "Region must be one of: us-east-1, us-west-2, eu-west-1"
  }
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-env"

  validation {
    condition     = length(var.project_name) > 0 && can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens"
  }
}

variable "team_name" {
  description = "Team name for resource tagging"
  type        = string
  default     = "platform"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block"
  }
}

variable "availability_zones_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3

  validation {
    condition     = var.availability_zones_count >= 2 && var.availability_zones_count <= 3
    error_message = "Availability zones count must be between 2 and 3"
  }
}

variable "database_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "dbadmin"

  validation {
    condition     = length(var.database_master_username) >= 1 && length(var.database_master_username) <= 16
    error_message = "Database username must be between 1 and 16 characters"
  }
}

variable "container_image" {
  description = "Docker image for ECS task"
  type        = string
  default     = "nginx:latest"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"

  validation {
    condition     = contains(["python3.9", "python3.10", "python3.11", "python3.12"], var.lambda_runtime)
    error_message = "Lambda runtime must be a supported Python version"
  }
}