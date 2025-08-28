variable "role_name" {
  description = "iam role name"
  type = string
}

variable "policy_name" {
  description = "IAM policy name"
  type = string
}

variable "assume_policy" {
  description = "IAM assume policy"
  type = string
}

variable "iam_policy" {
  description = "IAM policy document"
  type = string
}

variable "policy_arn" {
  description = "IAM policy arn"
  type = string
}