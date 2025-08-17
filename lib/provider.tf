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
  # backend "local" {
  #   path = "terraform.tfstate"
  # }
 backend "s3" {
    bucket         = "devs3-bucket-291749-nova"
    key            = "terraform.tfstate"
    region         = "us-west-2"  # <-- Correct region
   dynamodb_table = "terraform-lock"  # Optional for state locking
    encrypt        = true
  }
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