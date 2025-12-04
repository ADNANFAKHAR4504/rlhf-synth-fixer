variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "company_name" {
  description = "Company name for bucket naming"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of KMS key for encryption"
  type        = string
}

variable "enable_replication" {
  description = "Enable S3 bucket replication"
  type        = bool
  default     = false
}

variable "source_bucket_arn" {
  description = "ARN of source bucket for replication"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}