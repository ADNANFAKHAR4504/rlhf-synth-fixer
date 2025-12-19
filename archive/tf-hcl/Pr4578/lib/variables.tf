# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cw-analytics"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "alert_email_addresses" {
  description = "Email addresses to receive CloudWatch alerts"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "api_latency_threshold" {
  description = "API latency threshold in milliseconds"
  type        = number
  default     = 1000
}

variable "api_error_rate_threshold" {
  description = "API error rate threshold percentage"
  type        = number
  default     = 5
}

variable "lambda_error_threshold" {
  description = "Lambda error count threshold"
  type        = number
  default     = 10
}

variable "lambda_duration_threshold" {
  description = "Lambda duration threshold in milliseconds"
  type        = number
  default     = 3000
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold percentage"
  type        = number
  default     = 80
}

variable "rds_connection_threshold" {
  description = "RDS database connection threshold"
  type        = number
  default     = 100
}

variable "aggregation_interval_minutes" {
  description = "Interval for metric aggregation in minutes"
  type        = number
  default     = 5
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for alarms"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["DEBUG", "INFO", "WARNING", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARNING, ERROR"
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "CloudWatch Analytics"
    ManagedBy  = "Terraform"
    CostCenter = "Engineering"
  }
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  default     = "ChangeMe123456!"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}