variable "primary_kms_key_arn" {
  type        = string
  description = "ARN of the primary KMS key for S3 encryption"
}

variable "secondary_kms_key_arn" {
  type        = string
  description = "ARN of the secondary KMS key for S3 encryption"
}

variable "primary_bucket_prefix" {
  type        = string
  description = "Name prefix for the primary S3 bucket"
  default     = "tap-stack-primary"
}

variable "secondary_bucket_prefix" {
  type        = string
  description = "Name prefix for the secondary S3 bucket"
  default     = "tap-stack-secondary"
}

variable "logging_bucket_prefix" {
  type        = string
  description = "Name prefix for the logging S3 bucket"
  default     = "tap-stack-logging"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to all S3 buckets"
  default     = {}
}
