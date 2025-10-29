# variables.tf - Input variables for the Aurora Serverless infrastructure

variable "environment_suffix" {
  description = "Unique suffix for resource names (e.g., pr123, synth456)"
  type        = string
  default     = "test" # Default for local testing - CI/CD sets TF_VAR_environment_suffix from ENVIRONMENT_SUFFIX
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Name of the gaming platform project"
  type        = string
  default     = "gaming-platform"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = []
}

# Aurora Configuration
variable "database_name" {
  description = "Name of the default database"
  type        = string
  default     = "gaming_db"
}

# Secrets Manager configuration
variable "secret_name" {
  description = "Name of the AWS Secrets Manager secret for Aurora database credentials"
  type        = string
  default     = "" # Default empty, will create new secret if not specified
}

variable "secret_arn" {
  description = "ARN of existing Secrets Manager secret (used if secret already exists)"
  type        = string
  default     = ""
}

variable "aurora_mysql_version" {
  description = "Aurora MySQL engine version (latest stable for Serverless v2)"
  type        = string
  default     = "8.0"
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 2
}

variable "aurora_min_capacity" {
  description = "Minimum capacity for Aurora Serverless v2 (must be whole number)"
  type        = number
  default     = 1
}

variable "aurora_max_capacity" {
  description = "Maximum capacity for Aurora Serverless v2 (must be whole number)"
  type        = number
  default     = 128
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "backtrack_window_hours" {
  description = "Target backtrack window in hours (0-72) - disabled for compatibility"
  type        = number
  default     = 0
}

# Auto Scaling Configuration
variable "cpu_scale_up_threshold" {
  description = "CPU threshold percentage to trigger scale up"
  type        = number
  default     = 70
}

variable "cpu_scale_down_threshold" {
  description = "CPU threshold percentage to trigger scale down"
  type        = number
  default     = 30
}

variable "connections_scale_up_threshold" {
  description = "Database connections threshold to trigger scale up"
  type        = number
  default     = 12000
}

# S3 Backup Configuration
variable "backup_lifecycle_days" {
  description = "Days before transitioning backups to cheaper storage"
  type        = number
  default     = 30
}

variable "backup_expiration_days" {
  description = "Days before deleting old backups"
  type        = number
  default     = 90
}

# Monitoring Configuration
variable "alarm_email_endpoints" {
  description = "Email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

# Tagging
variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}