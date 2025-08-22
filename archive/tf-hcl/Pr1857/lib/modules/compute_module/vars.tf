variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["default", "staging", "prod"], var.environment)
    error_message = "Environment must be default, staging, or prod."
  }
}

variable "instance_type" {
    description = "Instance type. Ex: t3.micro"
}

variable "security_group_id" {
    description = "Security group ID for ec2 instances"
}

variable "instance_profile_name" {
    description = "Instance Profile name"
}

variable "kms_key_id" {
    description = "KMS key ID "
}

variable "kms_key_arn" {
    description = "KMS key ARN"
}

variable "tags" {
    description = "Common tags to configure for each service"
}

variable "private_subnet_ids" {
    description = "Private subnet ids to configure for autoscaling group" 
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

variable "public_subnet_ids" {
    description = "Public subnet IDs for LoadBalancer"
}

variable "alb_security_group_id" {
    description = "Security group for LoadBalancer"
}

variable "vpc_id" {
    description = "VPC ID for target group"
}