# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (prod or staging)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "Environment must be 'prod' or 'staging'."
  }
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "aurora_instance_class" {
  description = "Aurora instance size"
  type        = string
  default     = "db.t3.medium"
}

variable "ec2_instance_type" {
  description = "EC2 instance type for app servers"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_capacity" {
  description = "Minimum ASG capacity"
  type        = number
  default     = 2
}

variable "asg_max_capacity" {
  description = "Maximum ASG capacity"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
  default     = 3
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dr-app"
}

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
  default     = "v2"
}

