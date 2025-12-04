# variables.tf

# variable "aws_region" {
#   description = "AWS region for resources"
#   type        = string
#   default     = "us-east-1"
# }

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "enable_vpc_peering" {
  description = "Enable VPC peering connections"
  type        = bool
  default     = true
}

variable "ecs_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
}

variable "ecs_memory" {
  description = "Memory for ECS tasks in MB"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "sns_email_endpoint" {
  description = "Email endpoint for SNS notifications"
  type        = string
}

variable "company_name" {
  description = "Company name for S3 bucket naming"
  type        = string
  default     = "company"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS listener (required for production HTTPS)"
  type        = string
  default     = null
}