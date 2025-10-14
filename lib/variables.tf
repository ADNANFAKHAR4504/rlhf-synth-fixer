# variables.tf

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "banking-creds"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "VPC ID for resources"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS and Lambda"
  type        = list(string)
}

# RDS Configuration
variable "mysql_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0.35"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling"
  type        = number
  default     = 1000
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "banking"
}

# Rotation Configuration
variable "rotation_days" {
  description = "Number of days between automatic rotations"
  type        = number
  default     = 30
}

variable "max_retry_attempts" {
  description = "Maximum retry attempts for rotation"
  type        = string
  default     = "3"
}

# Alert Configuration
variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alerts"
  type        = list(string)
  default     = []
}

variable "rotation_failure_threshold" {
  description = "Threshold for rotation failure alerts"
  type        = number
  default     = 1
}

variable "rotation_duration_threshold" {
  description = "Threshold for rotation duration alerts (milliseconds)"
  type        = number
  default     = 30000
}

# Performance Insights Configuration
variable "enable_performance_insights" {
  description = "Enable Performance Insights for RDS (requires db.t3.small or larger)"
  type        = bool
  default     = false
}

# Rotation Configuration
variable "enable_rotation" {
  description = "Enable automatic secret rotation"
  type        = bool
  default     = true
}

variable "rotation_check_frequency_hours" {
  description = "How often to check for credentials needing rotation (in hours)"
  type        = number
  default     = 24
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Lambda runtime for rotation function"
  type        = string
  default     = "python3.11"
}