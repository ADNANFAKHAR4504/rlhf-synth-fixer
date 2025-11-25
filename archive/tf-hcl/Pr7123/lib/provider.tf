terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Using local backend for testing/development
  # For production, configure S3 backend with DynamoDB locking
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = "payment-processing-app"
      ManagedBy   = "terraform"
    }
  }
}
