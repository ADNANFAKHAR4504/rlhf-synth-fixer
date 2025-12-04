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

variable "kms_key_arn" {
  description = "ARN of KMS key"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of S3 bucket"
  type        = string
}

variable "rds_resource_name" {
  description = "RDS resource name"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}