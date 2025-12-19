# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # S3 backend for state management
  backend "s3" {
    # Backend config provided via -backend-config flags during init
    # Example: bucket, key, region, encrypt
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      {
        Environment       = var.environment_suffix
        Team              = var.team
        ManagedBy         = "terraform"
        EnvironmentSuffix = var.environment_suffix
      },
      var.additional_tags
    )
  }
}
