variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_data_s3_bucket_arn" {
  description = "ARN of the app data S3 bucket"
  type        = string
}

variable "s3_kms_key_arn" {
  description = "ARN of the S3 KMS key"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}
