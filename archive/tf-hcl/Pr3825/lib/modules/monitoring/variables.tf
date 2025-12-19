variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_function_arn" {
  description = "Lambda function ARN"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name"
  type        = string
}

variable "primary_alb_arn_suffix" {
  description = "Primary ALB ARN suffix"
  type        = string
}

variable "primary_tg_arn_suffix" {
  description = "Primary target group ARN suffix"
  type        = string
}

variable "primary_db_cluster_id" {
  description = "Primary DB cluster identifier"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "asg_desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
}

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
}

