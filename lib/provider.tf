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
      version = ">= 3.1"
    }
  }

  # S3 backend for remote state storage
  # Configuration will be provided via backend-config parameters during terraform init
  backend "s3" {
    # Backend configuration will be provided dynamically via -backend-config flags
    # This allows the same configuration to work across different environments
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
