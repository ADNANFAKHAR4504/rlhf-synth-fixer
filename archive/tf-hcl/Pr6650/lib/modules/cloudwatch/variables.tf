variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_cluster_id" {
  description = "Primary RDS cluster identifier"
  type        = string
}

variable "secondary_cluster_id" {
  description = "Secondary RDS cluster identifier"
  type        = string
}

variable "replication_lag_threshold" {
  description = "Replication lag alarm threshold in seconds"
  type        = number
  default     = 300
}

variable "sns_email" {
  description = "Email address for SNS notifications"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
}
