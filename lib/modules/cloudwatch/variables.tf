variable "log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  type        = string
}

variable "retention_in_days" {
  description = "Number of days to retain log events"
  type        = number
  default     = 90
}

variable "kms_key_id" {
  description = "KMS key ID for encrypting CloudWatch log group"
  type        = string
}

variable "metric_filter_name" {
  description = "Name for the metric filter"
  type        = string
}

variable "metric_pattern" {
  description = "Pattern to match in the log events"
  type        = string
}

variable "metric_name" {
  description = "Metric name for the CloudWatch metric filter"
  type        = string
}

variable "metric_namespace" {
  description = "Namespace for the CloudWatch metric"
  type        = string
}

variable "alarm_name" {
  description = "Name of the CloudWatch alarm"
  type        = string
}

variable "comparison_operator" {
  description = "Comparison operator for the alarm"
  type        = string
}

variable "evaluation_periods" {
  description = "Number of periods for alarm evaluation"
  type        = number
}

variable "period" {
  description = "Period in seconds over which the specified statistic is applied"
  type        = number
}

variable "statistic" {
  description = "Statistic to apply to the alarm's associated metric"
  type        = string
}

variable "threshold" {
  description = "Threshold value for the alarm"
  type        = number
}

variable "alarm_description" {
  description = "Description for the alarm"
  type        = string
}

variable "alarm_actions" {
  description = "List of ARNs to notify when the alarm is triggered"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags to apply to all CloudWatch resources"
  type        = map(string)
  default     = {}
}
