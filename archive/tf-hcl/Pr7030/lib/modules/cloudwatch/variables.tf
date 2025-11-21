variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "retention_days" {
  description = "Log retention in days"
  type        = number
}
