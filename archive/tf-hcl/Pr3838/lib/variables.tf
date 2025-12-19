variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "192.168.0.0/16"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "blogging-platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  default     = "ChangeMeToSecurePassword123!"
  sensitive   = true
}

variable "min_capacity" {
  description = "Minimum ACU capacity for Aurora Serverless v2"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum ACU capacity for Aurora Serverless v2"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.small"
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling group"
  type        = number
  default     = 5
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling group"
  type        = number
  default     = 2
}

locals {
  name_prefix = "${var.project_name}-${var.environment_suffix}"
}
