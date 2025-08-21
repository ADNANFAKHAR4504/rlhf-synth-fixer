# modules/iam_role/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket for IAM policy"
  type        = string
}

variable "role_name_prefix" {
  description = "Prefix for IAM role names"
  type        = string
  default     = "myapp"
}

variable "policy_name_prefix" {
  description = "Prefix for IAM policy names"
  type        = string
  default     = "myapp"
}

variable "assume_role_services" {
  description = "AWS services that can assume this role"
  type        = list(string)
  default     = ["ec2.amazonaws.com"]
}

variable "s3_permissions" {
  description = "S3 permissions to grant"
  type        = list(string)
  default     = ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
}

variable "role_tags" {
  description = "Additional tags for IAM role"
  type        = map(string)
  default     = {}
}
