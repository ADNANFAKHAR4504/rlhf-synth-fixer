terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.29.0"
    }
  }

  backend "s3" {
    # These will be configured via terraform init -backend-config
    # bucket         = "your-terraform-state-bucket"
    # key            = "terraform.tfstate"
    # region         = "us-east-1"
    # encrypt        = true
    # versioning     = true
    # dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "X"
      ManagedBy   = "Terraform"
      Environment = terraform.workspace
    }
  }
}