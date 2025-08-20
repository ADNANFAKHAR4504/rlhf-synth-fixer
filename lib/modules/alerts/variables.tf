variable "project_name" {
  type        = string
  description = "Name of the project"
}

variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming"
}

variable "notification_email" {
  type        = string
  description = "Email address for security notifications"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to resources"
  default     = {}
}
