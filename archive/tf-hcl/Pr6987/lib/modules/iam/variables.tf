# modules/iam/variables.tf

variable "lambda_validation_role_name" {
  description = "Name for the Lambda validation IAM role"
  type        = string
}

variable "lambda_fraud_role_name" {
  description = "Name for the Lambda fraud detection IAM role"
  type        = string
}

variable "lambda_notification_role_name" {
  description = "Name for the Lambda notification IAM role"
  type        = string
}

variable "eventbridge_role_name" {
  description = "Name for the EventBridge IAM role"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
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

variable "validation_queue_arn" {
  description = "ARN of the validation SQS queue"
  type        = string
}

variable "fraud_queue_arn" {
  description = "ARN of the fraud detection SQS queue"
  type        = string
}

variable "notification_queue_arn" {
  description = "ARN of the notification SQS queue"
  type        = string
}

variable "transaction_state_table_arn" {
  description = "ARN of the DynamoDB transaction state table"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for creating security group (optional)"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}