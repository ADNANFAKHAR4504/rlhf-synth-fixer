variable "log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  type        = string
}

variable "retention_in_days" {
  description = "Number of days to retain log events"
  type        = number
}

variable "sns_topic" {
  description = "Sns topc arn"
  type = string
}
