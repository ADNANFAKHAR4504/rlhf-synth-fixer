variable "environment" {
  description = "Environment name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "vpc_id" {
  description = "Optional existing VPC ID to use. If provided, the module will use this VPC instead of looking up by CIDR. Useful when the VPC was created/destroyed outside this module or to avoid accidental data-source mismatches."
  type        = string
  default     = ""
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
  description = "RDS backup retention period"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password (leave empty to auto-generate a secure random password)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ssh_key_name" {
  description = "SSH key name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "Optional ACM Certificate ARN to use for HTTPS listener. If empty, HTTPS listener will not be created by this module."
  type        = string
  default     = ""
}

variable "alb_internal" {
  description = "If true, create the ALB as internal. Set to true when VPC has no Internet Gateway or you want internal-only ALB."
  type        = bool
  default     = false
}