variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "devtest"
  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be between 1 and 20 characters"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for HTTP/HTTPS/SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "fintech-payment-platform"
}

variable "owner" {
  description = "Owner email for tagging"
  type        = string
  default     = "devops@fintech.example.com"
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}