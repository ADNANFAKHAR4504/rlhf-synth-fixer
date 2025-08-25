# provider.tf

# Terraform core and provider requirements
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Static S3 backend for state (variables not allowed in backend)
  # Update bucket, key, region as needed per project/CI
  backend "s3" {
    bucket  = "iac-rlhf-tf-states"                         # Central S3 bucket for all TF states
    key     = "global/app-http-https-sg/terraform.tfstate" # Path in bucket
    region  = "us-west-2"                                  # Region of S3 bucket
    encrypt = true                                         # Enable server-side encryption
    # use_lockfile   = false                     # Disable state locking (set to true and add dynamodb_table for production)
    # Note: State locking is disabled to avoid DynamoDB dependency. For production, create a DynamoDB table (e.g., 'iac-rlhf-tf-locks') with a partition key 'LockID' (string) and set use_lockfile = true, dynamodb_table = "iac-rlhf-tf-locks".
  }
}

# AWS provider
provider "aws" {
  # Region is sourced from variable in main.tf
  region = var.aws_region
}