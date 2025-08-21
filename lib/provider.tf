# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration - S3 for bootstrap compatibility
  backend "s3" {
    # Backend configuration will be provided via command line arguments
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Staging environment provider
provider "aws" {
  alias  = "staging"
  region = var.staging_region
  default_tags {
    tags = {
      environment = var.environment_names.staging
      project     = var.project_name
    }
  }
}

# Production environment provider
provider "aws" {
  alias  = "production"
  region = var.production_region
  default_tags {
    tags = {
      environment = var.environment_names.production
      project     = var.project_name
    }
  }
}

# Random provider
provider "random" {
  # Random provider configuration
}
