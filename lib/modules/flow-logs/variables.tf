variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for flow logs"
  type        = string
}

variable "log_prefix" {
  description = "Prefix for flow logs in S3"
  type        = string
}

variable "flow_log_name" {
  description = "Name for the flow log"
  type        = string
}

variable "environment_suffix" {
  description = "Random suffix for unique resource naming"
  type        = string
  default     = ""
}

variable "project_tags" {
  description = "Common project tags"
  type        = map(string)
  default     = {}
}
