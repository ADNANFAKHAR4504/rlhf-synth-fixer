# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "synth72610483"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "FintechAPI"
    ManagedBy   = "Terraform"
  }
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["https://example.com"]
}

variable "api_key" {
  description = "API key for authentication"
  type        = string
  sensitive   = true
  default     = "change-me-in-production"
}

variable "db_connection_string" {
  description = "Database connection string"
  type        = string
  sensitive   = true
  default     = "postgresql://user:pass@localhost/db"
}

variable "third_party_endpoint" {
  description = "Third party service endpoint"
  type        = string
  default     = "https://api.third-party.com/v1"
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "alerts@example.com"
}