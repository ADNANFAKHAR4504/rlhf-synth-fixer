terraform {
  required_version = ">= 1.0"

  backend "s3" {
    # Backend configuration provided via -backend-config flags during init
  }

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
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      CostCenter  = var.cost_center
      Environment = var.environment
      Compliance  = var.compliance
      ManagedBy   = "Terraform"
    }
  }
}

# Generate random password for database if not provided
resource "random_password" "db_password" {
  length  = 16
  special = true
}

locals {
  db_password = var.db_password != "" ? var.db_password : random_password.db_password.result
  common_tags = {
    Project     = "FinancialPortal"
    CostCenter  = var.cost_center
    Environment = var.environment
    Compliance  = var.compliance
  }
}
