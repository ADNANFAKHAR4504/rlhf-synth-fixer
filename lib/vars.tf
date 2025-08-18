variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "IaC-AWS-Nova-Model-Breaking"
}

variable "author" {
  description = "Author of the project"
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "created_date" {
  description = "Creation date of the project"
  type        = string
  default     = "2025-08-14T21:08:49Z"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "Region must be us-east-1 as strictly enforced."
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
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}


variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
   default     = []
}