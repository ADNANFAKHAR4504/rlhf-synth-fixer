# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

# Multi-region payment platform specific variables
variable "regions" {
  description = "Target AWS regions for deployment"
  type        = list(string)
  default     = ["us-east-1", "eu-west-1", "ap-southeast-1"]
}

variable "vpc_cidrs" {
  description = "VPC CIDR blocks per region"
  type        = map(string)
  default = {
    "us-east-1"      = "10.0.0.0/16"
    "eu-west-1"      = "10.1.0.0/16"
    "ap-southeast-1" = "10.2.0.0/16"
  }
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
}

variable "rds_instance_class" {
  description = "RDS instance class per environment"
  type        = map(string)
  default = {
    dev     = "db.r6g.large"
    staging = "db.r6g.xlarge"
    prod    = "db.r6g.2xlarge"
  }
}

variable "lambda_memory_size" {
  description = "Lambda memory size per environment"
  type        = map(number)
  default = {
    dev     = 512
    staging = 1024
    prod    = 3008
  }
}

variable "lambda_reserved_concurrent_executions" {
  description = "Lambda reserved concurrent executions per environment"
  type        = map(number)
  default = {
    dev     = 10
    staging = 50
    prod    = 500
  }
}

variable "api_domain_names" {
  description = "Custom domain names for API Gateway per region"
  type        = map(string)
  default = {
    "us-east-1"      = "api-us.payment.example.com"
    "eu-west-1"      = "api-eu.payment.example.com"
    "ap-southeast-1" = "api-ap.payment.example.com"
  }
}

variable "api_certificate_arns" {
  description = "ACM certificate ARNs for API Gateway custom domains"
  type        = map(string)
  default = {
    "us-east-1"      = "arn:aws:acm:us-east-1:123456789012:certificate/placeholder"
    "eu-west-1"      = "arn:aws:acm:eu-west-1:123456789012:certificate/placeholder"
    "ap-southeast-1" = "arn:aws:acm:ap-southeast-1:123456789012:certificate/placeholder"
  }
}