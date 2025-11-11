# Terraform version and required providers
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Must be 5.x, not 6.x for compatibility
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  backend "s3" {

  }
}

# Default provider (required even with aliased providers)
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
    }
  }
}

# Primary region provider
provider "aws" {
  region = "us-east-1"
  alias  = "primary"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Primary"
    }
  }
}

# DR region provider
provider "aws" {
  region = "us-west-2"
  alias  = "dr"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Secondary"
    }
  }
}

# Variables
variable "environmentSuffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "prod"
}

variable "database_master_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!SecurePassword"
}