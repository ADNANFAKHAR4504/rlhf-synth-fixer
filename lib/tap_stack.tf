# tap_stack.tf - Main Terraform stack file
# This file contains the primary stack configuration

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

