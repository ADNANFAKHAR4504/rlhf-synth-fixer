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
  region = "us-east-1"

  default_tags {
    tags = {
      Environment        = var.environment
      DataClassification = "FinancialData"
      Compliance         = "PCI-DSS"
      Owner              = "SecurityTeam"
      ManagedBy          = "Terraform"
    }
  }
}

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}