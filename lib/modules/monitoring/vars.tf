variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "asg_name" {
  description = "Name of the Auto Scaling group to monitor"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}
