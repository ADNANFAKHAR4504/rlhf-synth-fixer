provider "aws" {
  region = var.region

  default_tags {
    tags = {
      iac-rlhf-amazon = var.iac_rlhf_tag_value
    }
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration should be in a separate backend.tf file
  # after the S3 bucket has been created
}