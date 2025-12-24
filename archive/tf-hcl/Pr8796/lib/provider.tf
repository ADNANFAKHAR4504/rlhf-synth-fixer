# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Local backend for testing - S3 backend configured in CI/CD
  # backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "Production"
      Project     = "PaymentGateway"
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}
