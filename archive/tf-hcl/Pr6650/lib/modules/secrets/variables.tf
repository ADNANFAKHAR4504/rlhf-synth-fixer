variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS cluster endpoint"
  type        = string
  default     = ""
}

variable "enable_rotation" {
  description = "Enable automatic rotation of secrets"
  type        = bool
  default     = true
}