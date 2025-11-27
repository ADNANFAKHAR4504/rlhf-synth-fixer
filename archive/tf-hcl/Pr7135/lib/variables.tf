variable "environment_suffix" {
  description = "Unique suffix to prevent resource naming conflicts across parallel deployments"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda function in MB"
  type        = number
  default     = 3008
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "eventbridge_schedule" {
  description = "EventBridge schedule expression for batch processing"
  type        = string
  default     = "rate(5 minutes)"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Service     = "FraudDetection"
  }
}
