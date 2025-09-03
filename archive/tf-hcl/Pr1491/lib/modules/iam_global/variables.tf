// Variables for IAM global module

variable "resource_suffix" {
  type = string
}

variable "primary_bucket_arn" {
  type = string
}

variable "secondary_bucket_arn" {
  type = string
}

variable "primary_table_arn" {
  type = string
}

variable "secondary_table_arn" {
  type = string
}

variable "primary_kms_key_arn" {
  type = string
}

variable "secondary_kms_key_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
