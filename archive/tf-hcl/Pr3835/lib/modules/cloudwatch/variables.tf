# CloudWatch Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of Lambda function"
  type        = string
}

variable "primary_bucket_name" {
  description = "Name of primary S3 bucket"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of SNS topic for alarms"
  type        = string
}

variable "lambda_log_retention_days" {
  description = "Retention days for Lambda logs"
  type        = number
  default     = 7
}

variable "application_log_retention_days" {
  description = "Retention days for application logs"
  type        = number
  default     = 30
}

variable "alb_target_group_arn" {
  description = "ARN of ALB target group"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of ALB"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

