variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for ALB"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "instance_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}