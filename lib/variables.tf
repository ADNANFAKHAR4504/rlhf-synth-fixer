variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for resources"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

# Note: db_password is now retrieved from AWS Secrets Manager
# Secret name: payment-app/${var.environment}/db-password
# Secret format: {"password": "your-password-here"}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB and RDS"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 90
}

variable "allowed_ip_addresses" {
  description = "List of IP addresses to whitelist in WAF"
  type        = list(string)
  default     = []
}

variable "blocked_ip_addresses" {
  description = "List of IP addresses to blacklist in WAF"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "List of country codes to block in WAF"
  type        = list(string)
  default     = []
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS listener (optional)"
  type        = string
  default     = ""

  validation {
    condition     = var.certificate_arn == "" || can(regex("^arn:aws:acm:", var.certificate_arn))
    error_message = "certificate_arn must be a valid ACM certificate ARN or empty string."
  }
}