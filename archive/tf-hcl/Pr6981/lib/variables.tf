variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

## File: lib/provider.tf

# CI/CD Integration Variables
variable "repository" {
  description = "Repository name"
  type        = string
  default     = "iac-test-automations"
}

variable "commit_author" {
  description = "Commit author"
  type        = string
  default     = "terraform"
}

variable "pr_number" {
  description = "Pull request number"
  type        = string
  default     = "N/A"
}

variable "team" {
  description = "Team identifier"
  type        = string
  default     = "synth"
}
