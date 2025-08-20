variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "kms_key_main_arn" {
  description = "ARN of the main KMS key"
  type        = string
}

variable "notification_email" {
  description = "Email for notifications"
  type        = string
}

variable "autoscaling_group_name" {
  description = "Name of the web ASG"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB"
  type        = string
}

variable "web_scale_up_policy_arn" {
  description = "ARN of the web scale up policy"
  type        = string
}
