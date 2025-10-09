# variables.tf
# Configuration variables for multi-region serverless SaaS infrastructure

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "tap-saas"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for failover"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "tap-saas-test.xyz"
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda functions"
  type        = number
  default     = 100
}

variable "waf_rate_limit" {
  description = "WAF rate limit per IP address (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "blocked_countries" {
  description = "List of country codes to block for GDPR compliance"
  type        = list(string)
  default     = ["CN", "RU", "KP"] # Countries with data privacy concerns
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 90 # GDPR compliance requirement
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Application = "TAP-SaaS"
    ManagedBy   = "Terraform"
    Environment = "Production"
    CostCenter  = "Engineering"
    Compliance  = "GDPR"
  }
}

variable "enable_quicksight" {
  description = "Enable QuickSight analytics dashboard"
  type        = bool
  default     = true
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray distributed tracing"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "DynamoDB backup retention period in days"
  type        = number
  default     = 35
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 10000
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "ops@example.com"
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for DynamoDB tables"
  type        = bool
  default     = true
}

variable "min_read_capacity" {
  description = "Minimum read capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 5
}

variable "max_read_capacity" {
  description = "Maximum read capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 40000
}

variable "min_write_capacity" {
  description = "Minimum write capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 5
}

variable "max_write_capacity" {
  description = "Maximum write capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 40000
}

variable "target_tracking_read_capacity" {
  description = "Target utilization percentage for DynamoDB read capacity"
  type        = number
  default     = 70
}

variable "target_tracking_write_capacity" {
  description = "Target utilization percentage for DynamoDB write capacity"
  type        = number
  default     = 70
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "api_cache_enabled" {
  description = "Enable API Gateway caching"
  type        = bool
  default     = true
}

variable "api_cache_size" {
  description = "API Gateway cache size in GB"
  type        = string
  default     = "0.5"
}

variable "api_cache_ttl" {
  description = "API Gateway cache TTL in seconds"
  type        = number
  default     = 300
}

variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints for private connectivity"
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for global content delivery"
  type        = bool
  default     = true
}

variable "synthetic_canary_schedule" {
  description = "Schedule expression for CloudWatch Synthetics canary"
  type        = string
  default     = "rate(5 minutes)"
}

variable "enable_backup_plan" {
  description = "Enable AWS Backup for disaster recovery"
  type        = bool
  default     = true
}

variable "quicksight_user_arn" {
  description = "QuickSight user ARN for dashboard access"
  type        = string
  default     = ""
}