# ============================================================================
# Terraform and Provider Configuration
# Purpose: Define version constraints and provider settings for the 
# observability platform deployment
# ============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Pessimistic constraint for AWS provider 5.x
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4.0" # Minimum version for Lambda packaging
    }
  }
  backend "s3" {

  }
}

# ============================================================================
# AWS Provider Configuration
# Purpose: Configure AWS provider with default tags for resource management
# and cost tracking across all created resources
# ============================================================================
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "observability-platform"
      Owner       = "platform-team"
      ManagedBy   = "terraform"
      CostCenter  = "engineering"
    }
  }
}

# ============================================================================
# Variables
# Purpose: Define configurable parameters for the deployment
# ============================================================================
variable "environment" {
  description = "Environment name for resource naming and tagging"
  type        = string
  default     = "dev"
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "kanakatla.k@turing.com"
}