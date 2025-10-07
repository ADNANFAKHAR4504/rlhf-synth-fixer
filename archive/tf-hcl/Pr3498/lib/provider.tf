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
      version = ">= 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }

  # S3 backend for state management
  backend "s3" {
    # Backend configuration will be provided via init command
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
