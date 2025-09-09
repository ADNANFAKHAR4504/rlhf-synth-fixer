terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = var.aws_region

  # For CI/CD environments, credentials can be provided via:
  # 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  # 2. IAM roles for service accounts (IRSA) in EKS
  # 3. EC2 instance profile (for EC2-based runners)
  # 4. AWS STS assume role

  # Uncomment and configure one of the following methods:

  # Method 1: Static credentials (not recommended for production)
  # access_key = var.aws_access_key_id
  # secret_key = var.aws_secret_access_key

  # Method 2: Assume role (recommended for CI/CD)
  # assume_role {
  #   role_arn = var.aws_assume_role_arn
  # }

  # Method 3: Use environment variables (current setup)
  # AWS provider will automatically use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  # environment variables if they are set
}