variable "project" {
  description = "Project name"
  type        = string
}

variable "kms_key_id" {
  description = "KMS Key id"
  type        = string
}

variable "bucket_name" {
  description = "bucket Name"
  type        = string
}

variable "bucket_policy" {
  description = "S3 bucket policy"
  type = string
}