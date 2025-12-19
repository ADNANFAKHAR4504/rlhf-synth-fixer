# Terraform and Provider Configuration
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

# AWS Provider Configuration
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment        = var.environment
      Owner              = "PaymentTeam"
      CostCenter         = "Engineering"
      DataClassification = "Sensitive"
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}

# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}