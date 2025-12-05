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

  # Local backend for testing - production would use S3
  backend "local" {
    path = "terraform.tfstate"
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
