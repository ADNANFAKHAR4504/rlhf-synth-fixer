# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Using local backend for testing
  # In production, configure S3 backend via backend config file
}

# Primary provider for production VPC (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.aws_region
}

# Secondary provider for partner VPC (us-east-2)
provider "aws" {
  alias  = "partner"
  region = var.partner_region
}

# Default provider (uses primary region)
provider "aws" {
  region = var.aws_region
}