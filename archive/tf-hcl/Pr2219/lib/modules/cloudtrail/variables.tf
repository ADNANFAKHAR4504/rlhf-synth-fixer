variable "cloudtrail_log_retention" {
  description = "Retention period for CloudTrail CloudWatch logs in days"
  type        = number
  default     = 90
}

variable "kms_key_id" {
  description = "KMS Key ID for encrypting CloudTrail logs"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. dev, prod)"
  type        = string
}

variable "tags" {
  description = "Additional tags to apply"
  type        = map(string)
  default     = {}
}

variable "s3_bucket_name" {
  description = "S3 Bucket name"
  type = string
}

variable "cw_logs_role_arn" {
  description = "CloudWatch logs role arn"
  type = string
}

variable "cw_logs_group_arn" {
  description = "CloudWatch logs group arn"
  type = string
}

