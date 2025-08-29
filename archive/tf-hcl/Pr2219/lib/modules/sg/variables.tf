variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the security groups will be created"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into bastion"
  type        = string
}
