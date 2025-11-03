variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-event-processor"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "create_route53" {
  description = "Whether to create Route53 custom domain for API Gateway"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain name for API Gateway (required if create_route53 is true)"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID (required if create_route53 is true)"
  type        = string
  default     = ""
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "platform-engineering"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering-001"
}

variable "api_throttle_burst_limit" {
  description = "API Gateway burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway rate limit per second"
  type        = number
  default     = 10000
}

variable "lambda_timeout_ingestion" {
  description = "Timeout for ingestion Lambda in seconds"
  type        = number
  default     = 30
}

variable "lambda_timeout_processing" {
  description = "Timeout for processing Lambda in seconds"
  type        = number
  default     = 300
}

variable "lambda_timeout_storage" {
  description = "Timeout for storage Lambda in seconds"
  type        = number
  default     = 60
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

locals {
  name_prefix = "${var.project_name}-${var.environment_suffix}"

  common_tags = {
    Environment = var.environment
    Team        = var.team
    CostCenter  = var.cost_center
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}