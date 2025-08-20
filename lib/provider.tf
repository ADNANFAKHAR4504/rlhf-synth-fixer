# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Local backend configuration for development
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
