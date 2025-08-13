# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., pr123, dev)"
  type        = string
  default     = "dev"
}
