# modules/monitoring/variables.tf

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "sns_alerts_topic_name" {
  description = "Name for the SNS alerts topic"
  type        = string
}

variable "queue_depth_threshold" {
  description = "Threshold for queue depth alarms"
  type        = number
  default     = 1000
}

variable "validation_queue_name" {
  description = "Name of the validation queue for monitoring"
  type        = string
}

variable "fraud_queue_name" {
  description = "Name of the fraud detection queue for monitoring"
  type        = string
}

variable "notification_queue_name" {
  description = "Name of the notification queue for monitoring"
  type        = string
}

variable "validation_dlq_name" {
  description = "Name of the validation DLQ for monitoring"
  type        = string
}

variable "fraud_dlq_name" {
  description = "Name of the fraud detection DLQ for monitoring"
  type        = string
}

variable "notification_dlq_name" {
  description = "Name of the notification DLQ for monitoring"
  type        = string
}

variable "log_group_validation" {
  description = "CloudWatch log group name for validation Lambda"
  type        = string
}

variable "log_group_fraud" {
  description = "CloudWatch log group name for fraud detection Lambda"
  type        = string
}

variable "log_group_notification" {
  description = "CloudWatch log group name for notification Lambda"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "aws_region" {
  description = "AWS region for CloudWatch resources"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}