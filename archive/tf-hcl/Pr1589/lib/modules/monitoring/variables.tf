variable "project_name" {
  type        = string
  description = "Name of the project"
}

variable "environment_name" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming"
}

variable "cloudtrail_log_group_name" {
  type        = string
  description = "Name of the CloudTrail log group"
}

variable "sns_topic_arn" {
  type        = string
  description = "ARN of the SNS topic for alerts"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to resources"
  default     = {}
}
