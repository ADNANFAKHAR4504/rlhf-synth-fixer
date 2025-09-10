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

  # Backend configuration - uncomment after creating backend infrastructure
  # backend "s3" {
  #   bucket         = "tap-stack-terraform-state-XXXXXXXX" # Replace with actual bucket name from backend.tf output
  #   key            = "tap-stack/terraform.tfstate"
  #   region         = "us-west-2"
  #   dynamodb_table = "tap-stack-terraform-state-lock"
  #   encrypt        = true
  #   kms_key_id     = "alias/tap-stack-terraform-state"
  # }
}

provider "aws" {
  region = "us-west-2"
}