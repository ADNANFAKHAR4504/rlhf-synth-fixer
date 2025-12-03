# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Backend configuration - workspace-based state separation
  backend "s3" {}
}

# Single AWS provider - region determined by workspace's tfvars
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
