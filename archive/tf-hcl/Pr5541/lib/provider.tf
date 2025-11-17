terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Configure backend for state management
  backend "s3" {

  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment      = var.environmentSuffix
      Owner            = var.owner
      ComplianceLevel  = var.compliance_level
      ManagedBy        = "Terraform"
      SecurityBaseline = "enabled"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environmentSuffix" {
  description = "Environment suffix (dev, staging, prod)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environmentSuffix)
    error_message = "Environment suffix must be dev, staging, or prod."
  }
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "security-team"
}

variable "compliance_level" {
  description = "Compliance level for resources"
  type        = string
  default     = "high"
}

variable "external_id" {
  description = "External ID for cross-account role assumption"
  type        = string
  sensitive   = true
  default     = "test-external-id-123"
}

variable "trusted_account_id" {
  description = "Trusted AWS account ID for cross-account access"
  type        = string
  default     = "342597974367"
}

variable "notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "kanakatl.k@turing.com"
}