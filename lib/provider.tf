terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Backend configuration will be provided via -backend-config flags
    # during terraform init in the bootstrap script
  }
}

provider "aws" {
  region = var.aws_region
}