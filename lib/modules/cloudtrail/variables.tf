variable "environment" {
  description = "Environment name"
  type        = string
}

variable "organization_name" {
  description = "Organization name"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for CloudTrail encryption"
  type        = string
}
