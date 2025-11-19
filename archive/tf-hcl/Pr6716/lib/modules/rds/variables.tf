variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "region_name" {
  description = "AWS region name"
  type        = string
}

variable "cluster_name" {
  description = "Name of the RDS cluster"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where cluster will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the cluster"
  type        = list(string)
}

variable "engine" {
  description = "Database engine (aurora-mysql or aurora-postgresql)"
  type        = string

  validation {
    condition     = can(regex("^aurora-(mysql|postgresql)$", var.engine))
    error_message = "Engine must be aurora-mysql or aurora-postgresql."
  }
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
}

variable "instance_class" {
  description = "Instance class for cluster instances"
  type        = string
}

variable "instance_count" {
  description = "Number of instances in the cluster"
  type        = number
  default     = 2
}

variable "database_name" {
  description = "Name of the default database"
  type        = string
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "allowed_security_groups" {
  description = "List of security group IDs allowed to access the cluster"
  type        = list(string)
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enabled_cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
  default     = []
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying cluster"
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "cluster_parameters" {
  description = "List of cluster parameter group parameters"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string)
  }))
  default = []
}

variable "instance_parameters" {
  description = "List of instance parameter group parameters"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string)
  }))
  default = []
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "enhanced_monitoring_interval" {
  description = "Enhanced monitoring interval in seconds (0, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 60
}

variable "monitoring_role_arn" {
  description = "IAM role ARN for enhanced monitoring"
  type        = string
  default     = null
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}