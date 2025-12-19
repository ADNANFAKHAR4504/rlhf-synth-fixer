variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.110.0.0/16"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "evtmgmt"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix to avoid naming conflicts"
  type        = string
  default     = ""
}

locals {
  name_suffix     = var.environment_suffix != "" ? "-${var.environment_suffix}" : ""
  resource_prefix = "${var.project_name}${local.name_suffix}"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}
