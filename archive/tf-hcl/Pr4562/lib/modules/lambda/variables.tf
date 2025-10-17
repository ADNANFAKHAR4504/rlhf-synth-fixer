# modules/lambda/variables.tf - Lambda Module Variables

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "vpc-traffic-analyzer"
}

variable "vpc_a_log_group_name" {
  description = "CloudWatch log group name for VPC-A flow logs"
  type        = string
}

variable "vpc_b_log_group_name" {
  description = "CloudWatch log group name for VPC-B flow logs"
  type        = string
}

variable "vpc_a_log_group_arn" {
  description = "CloudWatch log group ARN for VPC-A flow logs"
  type        = string
}

variable "vpc_b_log_group_arn" {
  description = "CloudWatch log group ARN for VPC-B flow logs"
  type        = string
}

variable "traffic_baseline" {
  description = "Baseline traffic in requests per hour"
  type        = number
  default     = 417
}

variable "sns_topic_arn" {
  description = "ARN of SNS topic for alerts"
  type        = string
}

variable "allowed_ports" {
  description = "List of allowed ports for cross-VPC communication"
  type        = list(string)
  default     = ["443", "8080", "3306"]
}

variable "anomaly_threshold_percent" {
  description = "Percentage above baseline to trigger anomaly alert"
  type        = number
  default     = 20
}

variable "vpc_a_cidr" {
  description = "CIDR block of VPC-A"
  type        = string
}

variable "vpc_b_cidr" {
  description = "CIDR block of VPC-B"
  type        = string
}

variable "lambda_schedule" {
  description = "Schedule expression for Lambda execution"
  type        = string
  default     = "rate(1 hour)"
}

variable "retention_days" {
  description = "CloudWatch Logs retention period for Lambda logs"
  type        = number
  default     = 30
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

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "enable_xray" {
  description = "Enable AWS X-Ray tracing for Lambda function"
  type        = bool
  default     = true
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

variable "memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions for the Lambda function"
  type        = number
  default     = 10
}