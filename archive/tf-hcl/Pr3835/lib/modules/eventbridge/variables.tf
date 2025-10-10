# EventBridge Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of Lambda function to trigger"
  type        = string
}

variable "schedule_expression" {
  description = "Schedule expression for health check rule"
  type        = string
  default     = "rate(5 minutes)"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

