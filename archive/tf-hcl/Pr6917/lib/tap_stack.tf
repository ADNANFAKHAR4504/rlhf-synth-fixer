# Multi-Account Security Framework - Main Stack
# This file contains the aws_region variable required by unit tests
# All infrastructure resources are defined in separate .tf files

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}
