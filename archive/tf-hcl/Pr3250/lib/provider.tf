# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Using S3 backend for remote state management
  backend "s3" {
    # Backend configuration will be provided via terraform init -backend-config
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
