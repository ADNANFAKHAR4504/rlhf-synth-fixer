variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "global_cluster_identifier" {
  description = "Global cluster identifier"
  type        = string
}

variable "engine" {
  description = "Database engine"
  type        = string
  default     = "aurora-postgresql"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "master_username" {
  description = "Master username"
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "primary_cluster_identifier" {
  description = "Primary cluster identifier"
  type        = string
}

variable "primary_instance_class" {
  description = "Primary instance class"
  type        = string
}

variable "primary_instance_count" {
  description = "Number of primary instances"
  type        = number
  validation {
    condition     = var.primary_instance_count >= 1 && var.primary_instance_count <= 15
    error_message = "Primary instance count must be between 1 and 15"
  }
}

variable "primary_subnet_ids" {
  description = "Primary subnet IDs"
  type        = list(string)
}

variable "primary_security_group_id" {
  description = "Primary security group ID"
  type        = string
}

variable "secondary_cluster_identifier" {
  description = "Secondary cluster identifier"
  type        = string
}

variable "secondary_instance_class" {
  description = "Secondary instance class"
  type        = string
}

variable "secondary_instance_count" {
  description = "Number of secondary instances"
  type        = number
  validation {
    condition     = var.secondary_instance_count >= 1 && var.secondary_instance_count <= 15
    error_message = "Secondary instance count must be between 1 and 15"
  }
}

variable "secondary_subnet_ids" {
  description = "Secondary subnet IDs"
  type        = list(string)
}

variable "secondary_security_group_id" {
  description = "Secondary security group ID"
  type        = string
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days"
  }
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
}
