# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "payment_providers" {
  description = "List of payment provider identifiers for multi-tenant isolation"
  type        = set(string)
  default     = ["stripe", "paypal", "square"]
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda functions"
  type        = number
  default     = 100
}

variable "archival_days" {
  description = "Days before moving objects to archive storage"
  type        = number
  default     = 30
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttling rate limit (requests per second)"
  type        = number
  default     = 10000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 5000
}

variable "ecr_image_tag" {
  description = "Tag for Lambda container images"
  type        = string
  default     = "latest"
}