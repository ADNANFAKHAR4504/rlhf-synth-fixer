terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    # Configuration will be provided via -backend-config during init
  }
}

provider "aws" {
  region = var.aws_region
}