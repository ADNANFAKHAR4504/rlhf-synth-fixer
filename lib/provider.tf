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
  }

  # Backend configuration for state management
  # backend "s3" {
  #   # These values will be configured during terraform init via backend-config
  # }
}

# Environment suffix for resource naming
variable "environment_suffix" {
  description = "Suffix for resource naming to ensure uniqueness"
  type        = string
  default     = ""
}

# Generate unique suffix if not provided
resource "random_string" "unique_suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
  lower   = true
}

# AWS Region
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# Workspace configuration
variable "workspace_name" {
  description = "Terraform workspace name"
  type        = string
  default     = "default"
}

# Local values for environment configuration
locals {
  # Use environment suffix for resource naming, fallback to random if empty
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "dev-${random_string.unique_suffix.result}"

  # Determine environment based on workspace or suffix
  environment = terraform.workspace != "default" ? terraform.workspace : (
    contains(["pr", "dev"], substr(local.environment_suffix, 0, min(3, length(local.environment_suffix)))) ? "staging" : "production"
  )

  # AWS region
  region = var.aws_region

  # Consistent naming convention with environment suffix
  name_prefix = "tap-${local.environment_suffix}"

  # Common tags applied to all resources
  common_tags = {
    Environment       = local.environment
    EnvironmentSuffix = local.environment_suffix
    Region            = local.region
    Workspace         = terraform.workspace
    ManagedBy         = "terraform"
    Project           = "tap-stack"
  }
}

# Primary AWS Provider
provider "aws" {
  region = local.region

  default_tags {
    tags = local.common_tags
  }
}

# Data source to get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
