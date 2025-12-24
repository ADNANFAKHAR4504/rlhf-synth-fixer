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

  # Backend disabled for LocalStack testing
  # Original S3 backend commented out
  # backend "s3" {
  #   bucket         = "iac-rlhf-tf-states"
  #   key            = "global/app-http-https-sg/terraform.tfstate"
  #   region         = "us-west-2"
  #   encrypt        = true
  # }
}

# AWS provider
provider "aws" {
  # Region is sourced from variable in main.tf
  region = var.aws_region
}
