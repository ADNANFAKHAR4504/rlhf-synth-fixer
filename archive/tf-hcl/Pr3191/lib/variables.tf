# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "user-api"
    ManagedBy   = "terraform"
  }
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB users table"
  type        = string
  default     = "users"
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "dev"
}

variable "ssm_parameter_prefix" {
  description = "SSM parameter prefix for app configuration"
  type        = string
  default     = "/dev/api"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "user-registration-api"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}