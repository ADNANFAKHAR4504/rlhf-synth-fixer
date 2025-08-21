// Variables for logging module

variable "project_name" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "common_tags" {
  type = map(string)
}

variable "enable_vpc_flow_logs" {
  type    = bool
  default = true
}

variable "enable_cloudtrail" {
  type        = bool
  default     = true
  description = "Create a dedicated CloudTrail for this stack"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "logging_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for logs"
}

variable "logging_bucket_id" {
  type        = string
  description = "ID of the S3 bucket for logs"
}

variable "logging_bucket_arn" {
  type        = string
  description = "ARN of the S3 bucket for logs"
}

variable "cloudtrail_role_arn" {
  type        = string
  description = "ARN of the CloudTrail IAM role"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for flow logs"
}

variable "vpc_flow_role_arn" {
  type        = string
  description = "ARN of the VPC Flow Logs IAM role"
}
