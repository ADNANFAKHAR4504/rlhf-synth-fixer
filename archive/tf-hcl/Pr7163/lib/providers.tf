terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration commented out for QA testing
  # Use local state for testing environments
  # backend "s3" {
  #   bucket         = "terraform-state-rds-dr"
  #   key            = "rds-dr/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Environment = "DR"
      CostCenter  = "Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us-west-2"
  region = var.dr_region

  default_tags {
    tags = {
      Environment = "DR"
      CostCenter  = "Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}
