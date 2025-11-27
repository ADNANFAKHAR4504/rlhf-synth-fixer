variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "dr_region" {
  description = "DR AWS region"
  type        = string
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  sensitive   = true
}

variable "primary_subnet_ids" {
  description = "Primary region subnet IDs"
  type        = list(string)
}

variable "primary_vpc_id" {
  description = "Primary VPC ID"
  type        = string
}

variable "dr_subnet_ids" {
  description = "DR region subnet IDs"
  type        = list(string)
}

variable "dr_vpc_id" {
  description = "DR VPC ID"
  type        = string
}

variable "replication_lag_threshold" {
  description = "Replication lag threshold in seconds"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
