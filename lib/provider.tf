# Configure the AWS Provider
terraform {
  required_version = ">= 1.0"

  # backend "s3" {
  #   # Backend configuration disabled for CI/CD environments
  #   # Use local state for testing and validation
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Owner       = var.owner
      CostCenter  = var.cost_center
    }
  }
}

# Data source for current AWS account info
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
