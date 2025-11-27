terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-backend-prod"
    key            = "multi-account-security/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = merge(
      var.tags,
      {
        ManagedBy   = "Terraform"
        Environment = var.environment_suffix
      }
    )
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = merge(
      var.tags,
      {
        ManagedBy   = "Terraform"
        Environment = var.environment_suffix
      }
    )
  }
}
