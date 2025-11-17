variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "dr_role" {
  description = "DR role (primary or secondary)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for Lambda"
  type        = string
}

variable "rds_cluster_id" {
  description = "RDS cluster identifier"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS endpoint"
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "is_primary" {
  description = "Whether this is the primary region"
  type        = bool
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS Topic ARN for notifications"
  type        = string
  default     = ""
}
