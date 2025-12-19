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
  region = "eu-central-1"

  default_tags {
    tags = {
      Environment        = var.environment
      DataClassification = "Sensitive"
      Compliance         = "GDPR"
      Owner              = "FinOps-Team"
      ManagedBy          = "Terraform"
    }
  }
}

variable "environment" {
  description = "Environment name for resource naming and differentiation"
  type        = string
  default     = "dev"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "kanakatla.k@turing.com"
}