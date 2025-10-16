# variables.tf
variable "aws_region" {
  default = "us-east-1"
}
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ecommerce-startup"
    Environment = "production"
    Owner       = "devops-team"
    CostCenter  = "engineering"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "Must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = map(string)
  default = {
    "us-east-1a" = "10.0.1.0/24"
    "us-east-1b" = "10.0.2.0/24"
  }
}

variable "ssh_ingress_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/24"

  validation {
    condition     = can(cidrhost(var.ssh_ingress_cidr, 0))
    error_message = "Must be a valid IPv4 CIDR block."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "asg_min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1

  validation {
    condition     = var.asg_min_size >= 0
    error_message = "Minimum size must be 0 or greater."
  }
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 3

  validation {
    condition     = var.asg_max_size >= var.asg_desired_capacity
    error_message = "Maximum size must be greater than or equal to desired capacity."
  }
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold for CloudWatch alarm"
  type        = number
  default     = 70

  validation {
    condition     = var.cpu_alarm_threshold > 0 && var.cpu_alarm_threshold <= 100
    error_message = "CPU threshold must be between 1 and 100."
  }
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket name to ensure uniqueness"
  type        = string
  default     = "ecommerce-static-assets"
}