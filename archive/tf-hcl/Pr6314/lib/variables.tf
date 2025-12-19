# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "zero-trust-security"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "security-team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90
}

variable "kms_key_rotation_days" {
  description = "KMS key rotation period in days"
  type        = number
  default     = 90
}

variable "iam_session_duration_hours" {
  description = "IAM role session duration in hours"
  type        = number
  default     = 1
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for HTTPS traffic"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "enable_fips_endpoints" {
  description = "Enable FIPS endpoints where available"
  type        = bool
  default     = true
}

variable "application_bucket_name" {
  description = "Name for application data S3 bucket"
  type        = string
  default     = ""
}

variable "audit_bucket_name" {
  description = "Name for audit logs S3 bucket"
  type        = string
  default     = ""
}