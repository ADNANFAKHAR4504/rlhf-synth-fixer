# modules/iam_role/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket for IAM policy"
  type        = string
}
