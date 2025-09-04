// Variables for iam module

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

// Needed to build CloudTrail policy for logs
variable "cloudtrail_log_group_arn" {
  type = string
}
