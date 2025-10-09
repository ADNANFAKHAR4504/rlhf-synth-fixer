
terraform {
  required_version = ">= 1.2.0"

  backend "s3" {
    # Backend configuration will be provided via -backend-config flags
    # This ensures the backend block exists to avoid warnings
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "random" {}
