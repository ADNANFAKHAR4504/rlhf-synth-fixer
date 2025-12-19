# modules/monitoring/variables.tf - Monitoring Module Variables

variable "vpc_a_log_group_name" {
  description = "CloudWatch log group name for VPC-A flow logs"
  type        = string
}

variable "vpc_b_log_group_name" {
  description = "CloudWatch log group name for VPC-B flow logs"
  type        = string
}

variable "traffic_volume_threshold" {
  description = "Threshold for traffic volume alarm"
  type        = number
  default     = 500
}

variable "rejected_connections_threshold" {
  description = "Threshold for rejected connections alarm"
  type        = number
  default     = 50
}

variable "alert_email" {
  description = "Email address for alert notifications"
  type        = string
  sensitive   = true
}

variable "create_dashboard" {
  description = "Whether to create CloudWatch dashboard"
  type        = bool
  default     = true
}

variable "suffix" {
  description = "Random suffix for resource naming"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function for monitoring"
  type        = string
  default     = ""
}