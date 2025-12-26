variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "role_name" {
  description = "IAM role name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "aurora_cluster_arns" {
  description = "List of Aurora cluster ARNs"
  type        = list(string)
}
