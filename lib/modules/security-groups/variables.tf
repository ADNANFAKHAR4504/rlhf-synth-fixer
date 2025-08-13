variable "environment" {
  description = "Environment name"
  type        = string
}

variable "organization_name" {
  description = "Organization name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for management access"
  type        = list(string)
}