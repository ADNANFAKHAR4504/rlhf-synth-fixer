terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Using local backend for QA testing - removed S3 backend
  # backend "s3" {
  #   bucket         = "terraform-state-bucket-fintech"
  #   key            = "payment-platform/terraform.tfstate"
  #   region         = "ap-southeast-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  #   workspace_key_prefix = "workspaces"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "terraform"
      Project     = "payment-platform"
      Workspace   = terraform.workspace
    }
  }
}
