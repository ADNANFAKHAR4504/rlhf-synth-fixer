terraform {
  required_version = ">= 1.0"
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
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for deploying resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "project_name" {
  description = "Name of the project for tagging"
  type        = string
  default     = "market-data-processor"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering"
}

variable "notification_email" {
  description = "Email address for critical event notifications"
  type        = string
  default     = "kanakatla.k@turing.com"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address"
  }
}

variable "lambda_memory_mb" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout_seconds" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for each Lambda function"
  type        = number
  default     = 10
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "archive_retention_days" {
  description = "EventBridge archive retention in days"
  type        = number
  default     = 90
}

variable "dlq_message_retention_days" {
  description = "Dead letter queue message retention in days"
  type        = number
  default     = 4
}

variable "dlq_max_receive_count" {
  description = "Maximum receive count before sending to DLQ"
  type        = number
  default     = 2
}