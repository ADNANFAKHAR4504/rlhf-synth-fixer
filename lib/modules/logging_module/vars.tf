variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id_primary" {
  description = "VPC ID for primary region"
  type        = string
}

variable "vpc_id_secondary" {
  description = "VPC ID for secondary region"
  type        = string
}

variable "flow_logs_role_primary_arn" {
  description = "IAM role ARN for VPC Flow Logs in primary region"
  type        = string
}

variable "flow_logs_role_secondary_arn" {
  description = "IAM role ARN for VPC Flow Logs in secondary region"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
}