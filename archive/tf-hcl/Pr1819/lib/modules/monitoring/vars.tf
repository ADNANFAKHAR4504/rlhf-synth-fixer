variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "flow_log_role_arn" {
  description = "The ARN of the IAM role for VPC Flow Logs."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC."
  type        = string
}
