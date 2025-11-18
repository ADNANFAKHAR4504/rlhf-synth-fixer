variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "dev"
  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be between 1 and 20 characters"
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
  validation {
    condition     = var.availability_zones_count >= 2 && var.availability_zones_count <= 3
    error_message = "Must use between 2 and 3 availability zones"
  }
}

variable "db_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for Aurora PostgreSQL"
  type        = string
  sensitive   = true
  default     = ""
  validation {
    condition     = var.db_password == "" || length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters if provided"
  }
}

variable "container_image" {
  description = "Docker image for ECS tasks"
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:latest"
}

variable "container_port" {
  description = "Port exposed by container"
  type        = number
  default     = 80
}

variable "min_tasks_per_az" {
  description = "Minimum tasks per availability zone"
  type        = number
  default     = 2
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "noreply@example.com"
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alarm_email))
    error_message = "Must provide a valid email address"
  }
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment      = "production"
    DisasterRecovery = "enabled"
    ManagedBy        = "Terraform"
  }
}