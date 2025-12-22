variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "cluster_identifier" {
  description = "RDS cluster identifier"
  type        = string
}

variable "alarm_prefix" {
  description = "Prefix for alarm names"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or secondary)"
  type        = string
}

variable "sns_topic_name" {
  description = "SNS topic name for alerts"
  type        = string
}

variable "email_endpoints" {
  description = "Email endpoints for SNS notifications"
  type        = list(string)
}
