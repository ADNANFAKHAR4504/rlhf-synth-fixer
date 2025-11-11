################################################################################
# Terraform Provider and Configuration
################################################################################
#
# This file configures the AWS provider and defines global variables for:
#   - Infrastructure versioning and constraints
#   - AWS region and authentication
#   - Default tags for compliance and cost tracking
#   - Environment-specific customization
#
# FEATURES:
#   ✓ Terraform version >= 1.0 required
#   ✓ AWS provider version 5.x for latest features
#   ✓ S3 backend for state management
#   ✓ Default tags on all resources automatically
#   ✓ Environment-based naming and tagging
#   ✓ Cost center tracking for billing
#   ✓ Project tagging for resource organization
#
################################################################################

################################################################################
# Terraform Configuration
################################################################################

terraform {
  required_version = ">= 1.0"

  # AWS Provider Version Constraints
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote State Storage
  # Configure with S3 backend in local environment or CI/CD
  # Example: terraform init -backend-config="bucket=my-bucket" -backend-config="key=prod/terraform.tfstate" -backend-config="region=us-west-2"
  backend "s3" {


  }
}

################################################################################
# AWS Provider Configuration
################################################################################

provider "aws" {
  region = var.aws_region

  # Global tags applied to all resources automatically
  # These tags are required for compliance and cost allocation
  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environmentSuffix
      Project     = var.project
      CostCenter  = var.costCenter
    }
  }
}

################################################################################
# Global Variables for Tagging and Configuration
################################################################################

# Environment Suffix
# Used in resource naming and tagging for environment differentiation
variable "environmentSuffix" {
  description = "Environment suffix for resource naming (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"

  validation {
    condition     = can(regex("^(prod|staging|dev|test)$", var.environmentSuffix))
    error_message = "environmentSuffix must be one of: prod, staging, dev, test"
  }
}

# Project Name
# Used for resource tagging and cost allocation tracking
variable "project" {
  description = "Project name for tagging and resource organization"
  type        = string
  default     = "financial-services"

  validation {
    condition     = length(var.project) > 0 && length(var.project) <= 64
    error_message = "project name must be between 1 and 64 characters"
  }
}

# Cost Center
# Used for billing and cost allocation across departments
variable "costCenter" {
  description = "Cost center for billing and cost allocation"
  type        = string
  default     = "finance-dept"

  validation {
    condition     = length(var.costCenter) > 0 && length(var.costCenter) <= 64
    error_message = "costCenter must be between 1 and 64 characters"
  }
}

# AWS Region
# Region where all resources will be deployed
variable "aws_region" {
  description = "AWS region for resources (e.g., us-west-2, us-east-1, eu-west-1)"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d{1}$", var.aws_region))
    error_message = "aws_region must be a valid AWS region format (e.g., us-west-2)"
  }
}

################################################################################
# Usage Examples
################################################################################
#
# Local Development:
#   terraform apply -var="environmentSuffix=dev" -var="aws_region=us-west-2"
#
# Staging Environment:
#   terraform apply -var="environmentSuffix=staging" -var="aws_region=us-west-2"
#
# Production Environment:
#   terraform apply -var="environmentSuffix=prod" -var="aws_region=us-west-2"
#
# With Custom Values:
#   terraform apply \
#     -var="environmentSuffix=prod" \
#     -var="project=my-project" \
#     -var="costCenter=engineering" \
#     -var="aws_region=us-west-2"
#
# S3 Backend Configuration:
#   terraform init \
#     -backend-config="bucket=my-tfstate-bucket" \
#     -backend-config="key=prod/terraform.tfstate" \
#     -backend-config="region=us-west-2" \
#     -backend-config="encrypt=true" \
#     -backend-config="dynamodb_table=terraform-locks"
#
################################################################################
