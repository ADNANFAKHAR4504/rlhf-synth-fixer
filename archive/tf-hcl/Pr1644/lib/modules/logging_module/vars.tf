variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id_primary" {
  description = "VPC ID for primary region"
  type        = string
}

variable "vpc_id_secondary" {
  description = "VPC ID for secondary region"
  type        = string
}

variable "flow_logs_role_primary_arn" {
  description = "IAM role ARN for VPC Flow Logs in primary region"
  type        = string
}

variable "flow_logs_role_secondary_arn" {
  description = "IAM role ARN for VPC Flow Logs in secondary region"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
}

variable "create_log_groups" {
  description = "Whether to create CloudWatch Log Groups if they don't exist"
  type        = bool
  default     = true
}

variable "log_group_retention_days" {
  description = "Retention in days for created CloudWatch Log Groups"
  type        = number
  default     = 90
}