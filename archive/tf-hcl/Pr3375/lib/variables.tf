# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "region_prefix" {
  description = "Short region prefix for globally unique resources (e.g., usw2 for us-west-2)"
  type        = string
  default     = "usw2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-content-delivery"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the content delivery (optional - if not provided, uses CloudFront default domain)"
  type        = string
  default     = ""
}

variable "content_bucket_name" {
  description = "Name for the S3 bucket storing e-books"
  type        = string
  default     = ""
}

variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe, Israel
}

variable "geo_restriction_type" {
  description = "Type of geo restriction (none, whitelist, blacklist)"
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo restriction"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudFront logs"
  type        = number
  default     = 30
}

variable "enable_waf" {
  description = "Enable AWS WAF for additional protection"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "Rate limit for WAF rule (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "admin@tap-content-delivery.local"
}

variable "high_error_rate_threshold" {
  description = "Threshold for high error rate alarm (%)"
  type        = number
  default     = 5
}

variable "low_cache_hit_rate_threshold" {
  description = "Threshold for low cache hit rate alarm (%)"
  type        = number
  default     = 70
}

variable "high_origin_latency_threshold" {
  description = "Threshold for high origin latency alarm (ms)"
  type        = number
  default     = 1000
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for audit logging (Note: AWS limit is 5 trails per region - currently at limit)"
  type        = bool
  default     = false
}