// Variables for S3 replication module

variable "source_bucket_id" {
  type = string
}

variable "source_bucket_arn" {
  type = string
}

variable "destination_bucket_arn" {
  type = string
}

variable "source_kms_key_arn" {
  type = string
}

variable "destination_kms_key_arn" {
  type = string
}

variable "role_name_prefix" {
  type    = string
  default = "s3-replication-role"
}

variable "policy_name_prefix" {
  type    = string
  default = "s3-replication-policy"
}

variable "tags" {
  type    = map(string)
  default = {}
}
