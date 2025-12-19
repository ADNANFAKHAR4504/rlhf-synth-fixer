# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-processing"
}

variable "pr_number" {
  description = "PR number for resource identification and naming"
  type        = string

  validation {
    condition     = can(regex("^pr[0-9]+", var.pr_number))
    error_message = "pr_number must start with 'pr' followed by numbers (e.g., pr6969dev, pr6969staging)."
  }
}

variable "vpc_cidr_base" {
  description = "Base CIDR for VPC (first two octets)"
  type        = string
  default     = "10.0"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "container_image" {
  description = "Docker image for payment processing application"
  type        = string
  default     = "nginx:latest" # Replace with actual payment app image
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}