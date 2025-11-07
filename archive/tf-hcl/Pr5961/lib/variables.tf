variable "environmentSuffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
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

variable "fraud_detection_cpu" {
  description = "CPU units for fraud detection service"
  type        = number
  default     = 1024
}

variable "fraud_detection_memory" {
  description = "Memory for fraud detection service"
  type        = number
  default     = 2048
}

variable "transaction_processor_cpu" {
  description = "CPU units for transaction processor service"
  type        = number
  default     = 1024
}

variable "transaction_processor_memory" {
  description = "Memory for transaction processor service"
  type        = number
  default     = 2048
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag"
  type        = string
  default     = "fraud-detection"
}
