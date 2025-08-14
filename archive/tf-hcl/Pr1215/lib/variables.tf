variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "trusted_cidr_blocks" {
  description = "Trusted CIDR blocks for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "synthtrainr845"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "WebApplication"
    ManagedBy   = "Terraform"
  }
}