terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Backend configuration should be provided via backend config file
    # Example: terraform init -backend-config=backend.tfvars
    encrypt = true
  }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = var.tags
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = var.tags
  }
}
