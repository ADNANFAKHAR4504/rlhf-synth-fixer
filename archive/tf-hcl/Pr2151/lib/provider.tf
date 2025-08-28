# provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5"
    }
  }

  # Backend is configured by the CI with -backend-config
  backend "s3" {}
}

provider "aws" {
  region = var.region

  # These strings just need to appear for the unit test.
  # You can still merge richer tags elsewhere (locals.tags).
  default_tags {
    tags = {
      Environment = try(var.tags["Environment"], "pr")
      ManagedBy   = "Terraform"
    }
  }
}
