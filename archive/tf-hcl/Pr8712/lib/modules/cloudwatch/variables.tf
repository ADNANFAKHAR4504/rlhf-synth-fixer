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

variable "retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
