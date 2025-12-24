variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda"
  type        = list(string)
}

variable "memory_size" {
  description = "Memory size in MB"
  type        = number
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
