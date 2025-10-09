terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {}
}

provider "aws" {
  region = "us-west-2"  # Hardcoded as per requirements
  default_tags {
    tags = {
      iac-rlhf-amazon = "true"
    }
  }
}
