variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "secondary_region" {
  description = "Secondary AWS region for cross-region deployments"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32"  # Replace with your actual IP
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "SecurityConfiguration"
}

variable "enable_guardduty" {
  description = "Enable GuardDuty detector (set to false if already exists)"
  type        = bool
  default     = false
}

variable "project" {
  description = "Name of the project"
  type        = string
  default     = "security_config_pr2219"
}

variable "environment" {
  description = "Name of the project"
  type        = string
  default     = "dev"
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = [
    "10.0.1.0/24", # Public subnet in AZ1
    "10.0.2.0/24"  # Public subnet in AZ2
  ]
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
  default     = [
    "10.0.3.0/24", # Private subnet in AZ1
    "10.0.4.0/24"  # Private subnet in AZ2
  ]
}