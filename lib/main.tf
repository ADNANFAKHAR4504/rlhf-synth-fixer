terraform {
  required_version = ">= 1.0"
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

  backend "s3" {}
}

provider "aws" {
  region = "us-east-1" # Hardcoded as per requirements
  default_tags {
    tags = {
      iac-rlhf-amazon = "true"
    }
  }
}

locals {
  secret_suffix = formatdate("YYYYMMDDhhmmss", timestamp())
}
