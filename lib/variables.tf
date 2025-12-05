# Minimal variables - most values are hardcoded in main.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
