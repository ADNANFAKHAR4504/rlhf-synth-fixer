variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "email_addresses" {
  description = "Email addresses for SNS subscriptions"
  type        = list(string)
}
