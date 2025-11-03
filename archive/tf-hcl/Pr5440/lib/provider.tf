# Terraform and Provider Configuration
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
  backend "s3" {

  }
}

# Variables (ADDED - CI needs these!)
variable "environmentSuffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "FinancialServices"
}

variable "costCenter" {
  description = "Cost center"
  type        = string
  default     = "DataInfrastructure"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-1"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environmentSuffix
      Project     = var.project
      CostCenter  = var.costCenter
    }
  }
}
