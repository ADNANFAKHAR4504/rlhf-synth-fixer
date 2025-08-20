// Variables for lambda module

// Module: lambda
variable "project_name" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "common_tags" {
  type = map(string)
}

variable "lambda_role_arn" {
  type = string
}
