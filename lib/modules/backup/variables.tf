variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "backup_role_arn" {
  description = "IAM role ARN for AWS Backup"
  type        = string
}

variable "primary_aurora_cluster_arn" {
  description = "Primary Aurora cluster ARN"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

