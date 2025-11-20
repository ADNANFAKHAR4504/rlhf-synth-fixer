variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 10
    error_message = "environment_suffix must be between 1 and 10 characters"
  }
}

variable "source_region" {
  description = "Source AWS region (us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "target_region" {
  description = "Target AWS region (eu-west-1)"
  type        = string
  default     = "eu-west-1"
}

variable "migration_phase" {
  description = "Current migration phase (planning, sync, cutover, completed)"
  type        = string
  default     = "planning"

  validation {
    condition     = contains(["planning", "sync", "cutover", "completed"], var.migration_phase)
    error_message = "migration_phase must be one of: planning, sync, cutover, completed"
  }
}

variable "cutover_date" {
  description = "Planned cutover date in YYYY-MM-DD format"
  type        = string
  default     = "2025-12-31"
}

variable "enable_step_functions" {
  description = "Enable Step Functions for migration orchestration (optional enhancement)"
  type        = bool
  default     = true
}

variable "enable_eventbridge" {
  description = "Enable EventBridge for event tracking (optional enhancement)"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable AWS Backup for data protection (optional enhancement)"
  type        = bool
  default     = true
}

variable "document_retention_days" {
  description = "Number of days to retain documents in S3 lifecycle policy"
  type        = number
  default     = 90
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@example.com"
}

variable "replication_lag_threshold_seconds" {
  description = "DynamoDB replication lag threshold for alarms (seconds)"
  type        = number
  default     = 1
}
