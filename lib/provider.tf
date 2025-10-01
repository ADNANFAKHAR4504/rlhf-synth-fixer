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

  # Using local backend for testing without AWS credentials
  # In production, this should use S3 backend
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
