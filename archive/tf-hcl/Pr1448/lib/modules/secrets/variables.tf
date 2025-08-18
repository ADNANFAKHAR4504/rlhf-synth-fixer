variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_host" {
  description = "Database host (will be set after RDS creation)"
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Database name"
  type        = string
}
