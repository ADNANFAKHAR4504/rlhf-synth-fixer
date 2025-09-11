terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration for S3 remote state
  backend "s3" {
    bucket         = "tap-stack-terraform-state-1d25e325c0ebf3b2"
    key            = "tap-stack/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    kms_key_id     = "alias/tap-stack-terraform-state-1d25e325c0ebf3b2"
    dynamodb_table = "tap-stack-terraform-state-lock"
  }
}

provider "aws" {
  region = "us-west-2"
}