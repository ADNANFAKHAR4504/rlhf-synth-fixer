# variables.tf

# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "global-content-delivery"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "global-content-delivery"
    ManagedBy   = "terraform"
    CostCenter  = "media-operations"
  }
}

# Region Configuration
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "ap-southeast-1"
}

# Security Configuration
variable "origin_verify_secret" {
  description = "Secret header value to verify requests from CloudFront"
  type        = string
  sensitive   = true
  default     = "generate-a-secure-random-string"
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

# WAF Configuration
variable "waf_rate_limit" {
  description = "Rate limit for WAF rule (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "waf_blocked_threshold" {
  description = "Threshold for WAF blocked requests alarm"
  type        = number
  default     = 100
}

# CloudFront Configuration
variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_All"

  validation {
    condition = contains([
      "PriceClass_100",
      "PriceClass_200",
      "PriceClass_All"
    ], var.cloudfront_price_class)
    error_message = "Invalid CloudFront price class."
  }
}

variable "cloudfront_min_ttl" {
  description = "Minimum TTL for CloudFront cache"
  type        = number
  default     = 0
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache"
  type        = number
  default     = 86400 # 24 hours
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache"
  type        = number
  default     = 31536000 # 365 days
}

# Monitoring Configuration
variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "devang.p@turing.com"
}

variable "error_rate_threshold" {
  description = "Error rate threshold for CloudWatch alarms (percentage)"
  type        = number
  default     = 5
}

# S3 Configuration
variable "enable_s3_replication" {
  description = "Enable S3 cross-region replication"
  type        = bool
  default     = true
}

variable "s3_lifecycle_transition_days" {
  description = "Days before transitioning objects to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_glacier_days" {
  description = "Days before transitioning objects to Glacier storage"
  type        = number
  default     = 90
}

variable "s3_noncurrent_version_expiration_days" {
  description = "Days before deleting non-current object versions"
  type        = number
  default     = 90
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Runtime for Lambda@Edge functions"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_timeout" {
  description = "Timeout for Lambda@Edge functions (seconds)"
  type        = number
  default     = 5

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 30
    error_message = "Lambda@Edge timeout must be between 1 and 30 seconds."
  }
}

# DNS Configuration
variable "route53_ttl" {
  description = "TTL for Route 53 DNS records"
  type        = number
  default     = 300
}

# Analytics Configuration
variable "enable_quicksight" {
  description = "Enable QuickSight for analytics (requires QuickSight account setup)"
  type        = bool
  default     = false
}

variable "analytics_retention_days" {
  description = "Retention period for analytics data (days)"
  type        = number
  default     = 90
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for audit logging (may hit account limits)"
  type        = bool
  default     = false
}

# Compliance Configuration
variable "enable_gdpr_compliance" {
  description = "Enable GDPR compliance features"
  type        = bool
  default     = true
}

variable "enable_hipaa_compliance" {
  description = "Enable HIPAA compliance features"
  type        = bool
  default     = false
}

# Performance Configuration
variable "enable_http3" {
  description = "Enable HTTP/3 support in CloudFront"
  type        = bool
  default     = true
}

variable "enable_compression" {
  description = "Enable automatic compression in CloudFront"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Use spot instances where applicable"
  type        = bool
  default     = false
}

variable "enable_cost_alerts" {
  description = "Enable cost threshold alerts"
  type        = bool
  default     = true
}

variable "monthly_budget" {
  description = "Monthly budget for cost alerts (USD)"
  type        = number
  default     = 5000
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Retention period for backups (days)"
  type        = number
  default     = 30
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for applicable services"
  type        = bool
  default     = true
}

# Advanced Features
variable "enable_origin_shield" {
  description = "Enable CloudFront Origin Shield"
  type        = bool
  default     = false
}

variable "origin_shield_region" {
  description = "AWS region for Origin Shield"
  type        = string
  default     = "us-east-1"
}

variable "enable_field_level_encryption" {
  description = "Enable field-level encryption in CloudFront"
  type        = bool
  default     = false
}

# Development/Testing
variable "enable_debug_logs" {
  description = "Enable debug logging (not recommended for production)"
  type        = bool
  default     = false
}

variable "enable_test_endpoints" {
  description = "Enable test endpoints for development"
  type        = bool
  default     = false
}