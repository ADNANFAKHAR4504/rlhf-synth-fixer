terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}