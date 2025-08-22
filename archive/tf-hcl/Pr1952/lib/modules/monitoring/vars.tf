variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., staging, production)"
  type        = string
}

variable "notification_email" {
  description = "The email address for notifications"
  type        = string
}

variable "asg_name" {
  description = "The name of the Auto Scaling group"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

variable "random_suffix" {
  description = "A random string to ensure resource name uniqueness"
  type        = string
}
