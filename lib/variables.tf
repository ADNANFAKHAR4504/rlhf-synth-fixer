variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32"  # Replace with your actual IP
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "SecurityConfiguration"
}