variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-processing"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "fintech-team"
}

variable "alert_email" {
  description = "Email address for SNS alerts"
  type        = string
}

variable "enable_cross_region_replication" {
  description = "Enable S3 cross-region replication for production"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "Region for S3 cross-region replication"
  type        = string
  default     = "us-west-2"
}