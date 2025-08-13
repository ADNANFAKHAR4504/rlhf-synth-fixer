variable "environment" {
  description = "Environment name"
  type        = string
}

variable "organization_name" {
  description = "Organization name"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for S3 encryption"
  type        = string
}