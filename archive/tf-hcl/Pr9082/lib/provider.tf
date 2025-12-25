# provider.tf

# Terraform core and provider requirements
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.100.0"
    }
  }

  backend "s3" {}
}

# AWS provider
provider "aws" {
  region = var.aws_region
}
