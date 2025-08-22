# provider.tf

# ============================================================================
# TERRAFORM CONFIGURATION
# ============================================================================
terraform {
  required_version = ">= 0.14"
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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# ============================================================================
# PROVIDER CONFIGURATION - MULTI-REGION SETUP
# ============================================================================
# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (eu-west-1)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}