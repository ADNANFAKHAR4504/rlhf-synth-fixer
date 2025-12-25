variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "allowed_ip_ranges" {
  description = "List of IP ranges allowed to access S3 buckets"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "iac-qa-storage"
}

variable "security_notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "security-team@company.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "secure-data-storage"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = ""
}

variable "create_cloudtrail" {
  description = "Whether to create CloudTrail (set to false if you already have 5 trails in the region)"
  type        = bool
  default     = false
}

variable "is_localstack" {
  description = "Whether deploying to LocalStack (disables unsupported services)"
  type        = bool
  default     = false
}