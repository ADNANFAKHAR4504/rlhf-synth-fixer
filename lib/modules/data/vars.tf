variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., staging, production)"
  type        = string
}

variable "app_data_s3_bucket_arn" {
  description = "ARN of the S3 bucket for application data"
  type        = string
}

variable "s3_kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  type        = string
}

variable "region" {
  description = "AWS region for the deployment"
  type        = string
}

variable "name_prefix" {
  description = "A consistent prefix for resource naming"
  type        = string
}

variable "random_suffix" {
  description = "A random string to ensure resource name uniqueness"
  type        = string
}
