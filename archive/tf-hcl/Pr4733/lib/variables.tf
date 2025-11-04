# variables.tf

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming (e.g., pr123, dev)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "fintechapi-v2"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "api_stage" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "enable_route53" {
  description = "Enable Route 53 for custom domain routing"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = ""
}

variable "master_api_key" {
  description = "Master API key for authentication"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-master-key-12345"
}

variable "jwt_secret" {
  description = "JWT secret for token signing"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-jwt-secret-67890"
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["https://app.example.com"]
}

variable "transaction_rate_limit" {
  description = "Maximum transactions per second per user"
  type        = number
  default     = 10
}

variable "alarm_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = "alerts@example.com"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Financial Services API"
    Environment = "Production"
    Compliance  = "GDPR"
    ManagedBy   = "Terraform"
  }
}

variable "waf_ip_whitelist" {
  description = "IP addresses to whitelist in WAF"
  type        = list(string)
  default     = []
}

variable "waf_rate_limit" {
  description = "WAF rate limit per 5-minute window"
  type        = number
  default     = 10000
}

variable "enable_api_caching" {
  description = "Enable API Gateway caching"
  type        = bool
  default     = false
}

variable "api_cache_size" {
  description = "API Gateway cache size in GB"
  type        = string
  default     = "0.5"
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "xray_sampling_rate" {
  description = "X-Ray sampling rate (0.0 to 1.0)"
  type        = number
  default     = 0.1
}

variable "enable_vpc" {
  description = "Enable VPC for Lambda functions"
  type        = bool
  default     = false
}