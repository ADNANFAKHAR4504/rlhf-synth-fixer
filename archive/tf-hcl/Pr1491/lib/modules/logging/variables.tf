// Variables for logging (CloudTrail + S3 logging bucket policy)

variable "create_cloudtrail" {
  type    = bool
  default = false
}

variable "logging_bucket_id" {
  type = string
}

variable "logging_bucket_arn" {
  type = string
}

variable "primary_kms_key_arn" {
  type = string
}

variable "primary_data_bucket_arn" {
  type = string
}

variable "secondary_data_bucket_arn" {
  type = string
}

variable "s3_key_prefix" {
  type    = string
  default = "cloudtrail-logs"
}

variable "tags" {
  type    = map(string)
  default = {}
}
