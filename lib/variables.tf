variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "pr_number" {
  description = "PR number for resource naming"
  type        = string
  default     = "1234"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold for CloudWatch alarm"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 2
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair for EC2 instances"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN to use for HTTPS listener in the module. If empty, no HTTPS listener will be created."
  type        = string
  default     = ""
}

variable "alb_internal" {
  description = "If true, create the ALB as internal. Useful when the target VPC has no Internet Gateway."
  type        = bool
  default     = false
}