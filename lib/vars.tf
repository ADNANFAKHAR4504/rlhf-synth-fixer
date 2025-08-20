# Variables
variable "aws_region" {
  type    = string
  default = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in format like us-east-1."
  }
}

variable "project_name" {
  type = string
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.project_name))
    error_message = "Project name must start with letter and contain only alphanumeric characters and hyphens."
  }
}

variable "environment_name" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment_name)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  type        = string
  default     = "dev"
  description = "Unique suffix to avoid resource naming conflicts between deployments"
}

variable "enable_cloudtrail" {
  type        = bool
  default     = true
  description = "Create a dedicated CloudTrail for this stack"
}

variable "notification_email" {
  type = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
  }
}

variable "allowed_ssh_cidrs" {
  type    = list(string)
  default = []
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium", "t3.large"], var.instance_type)
    error_message = "Instance type must be one of: t3.micro, t3.small, t3.medium, t3.large."
  }
}

variable "enable_vpc_flow_logs" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}