# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Using S3 backend for state management
  backend "s3" {
    # Configuration will be provided via backend-config flags during init
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
