variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev3"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "payment-events"
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 60
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda functions"
  type        = number
  default     = 100
}

variable "dynamodb_table_name" {
  description = "Base name for DynamoDB table"
  type        = string
  default     = "processed-events"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR repository"
  type        = string
  default     = "MUTABLE"
}

variable "ecr_lifecycle_policy_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 10
}

variable "dynamodb_pitr_retention_days" {
  description = "Point-in-time recovery retention period in days"
  type        = number
  default     = 35
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
