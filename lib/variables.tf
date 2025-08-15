variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "Existing VPC ID (leave empty to use default VPC)"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "securitydemo"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access web tier"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "database_name" {
  description = "Database name for secrets"
  type        = string
  default     = "appdb"
}

variable "enable_secret_rotation" {
  description = "Enable automatic rotation for secrets"
  type        = bool
  default     = true
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail log retention in days"
  type        = number
  default     = 90
}

variable "environment_suffix" {
  description = "Suffix to append to resource names to avoid conflicts"
  type        = string
  default     = ""
}