# Variables for the AWS infrastructure

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region deployment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project - used for resource naming and tagging"
  type        = string
  default     = "webapp"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "corporate_cidrs" {
  description = "List of corporate CIDR blocks allowed to access resources"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

# Note: No SSH key needed - using AWS Systems Manager Session Manager for secure access

variable "tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default = {
    Owner      = "DevOps"
    CostCenter = "Engineering"
    Compliance = "Required"
  }
}
