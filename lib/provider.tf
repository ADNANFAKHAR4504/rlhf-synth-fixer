terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environmentSuffix
      Project     = var.project
      CostCenter  = var.costCenter
    }
  }
}

# Variables for tagging and naming
variable "environmentSuffix" {
  description = "Environment suffix for resource naming (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "financial-services"
}

variable "costCenter" {
  description = "Cost center for billing and cost allocation"
  type        = string
  default     = "finance-dept"
}