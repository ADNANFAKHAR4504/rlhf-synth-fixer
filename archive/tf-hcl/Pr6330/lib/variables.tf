variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
  default     = "startup-vpc"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
  default     = "prod"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag value"
  type        = string
  default     = "startup-infrastructure"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.3.0/24", "10.0.5.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.2.0/24", "10.0.4.0/24", "10.0.6.0/24"]
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}
