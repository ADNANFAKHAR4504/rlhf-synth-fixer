# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # S3 backend configuration
  # Backend values are provided via -backend-config flags during terraform init
  # This allows the bootstrap script to dynamically set bucket, key, and region
  backend "s3" {
    # Values are provided via -backend-config during terraform init
    # bucket, key, region, and encrypt are set by the bootstrap script
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = "webhook-processing"
      ManagedBy   = "Terraform"
    }
  }
}

