# FILE: provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6"
    }
  }
  # backend "s3" {
  #   bucket         = var.bucket_name
  #   key            = "terraform/state"
  #   region         = var.bucket_region
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }

}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}
