terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      Purpose     = var.purpose
      Compliance  = var.compliance
    }
  }
}

# Variables for configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "ecommerce-dev"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "owner" {
  description = "Owner tag value"
  type        = string
  default     = "security-team"
}

variable "cost_center" {
  description = "Cost center tag value"
  type        = string
  default     = "compliance"
}

variable "purpose" {
  description = "Purpose tag value"
  type        = string
  default     = "audit-logging"
}

variable "compliance" {
  description = "Compliance framework"
  type        = string
  default     = "HIPAA"
}