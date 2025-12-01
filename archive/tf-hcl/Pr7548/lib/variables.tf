variable "environment_suffix" {
  description = "Unique suffix for resource naming across deployments"
  type        = string
  # Default value to avoid naming conflicts when deployment script doesn't pass the variable
  # Using "default" as a fallback to minimize conflicts with actual environment names
  # Note: This is a temporary workaround. Deployment scripts should pass -var="environment_suffix=$ENVIRONMENT_SUFFIX"
  default = "default"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "lambda_architecture" {
  description = "Lambda architecture"
  type        = string
  default     = "arm64"
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
  default     = 10
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit (requests per minute)"
  type        = number
  default     = 1000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 30
}

variable "alarm_error_rate_threshold" {
  description = "Lambda error rate threshold for alarms (percentage)"
  type        = number
  default     = 1
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for alarms"
  type        = number
  default     = 1
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}
