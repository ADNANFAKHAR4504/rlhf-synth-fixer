terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    # Backend configuration is provided via -backend-config flags
    # This allows dynamic configuration based on environment variables
  }

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
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}
