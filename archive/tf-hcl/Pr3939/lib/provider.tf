# provider.tf
# Region: us-east-1
# Purpose: Secure, compliant AWS foundation for production workloads

terraform {
  required_version = ">= 1.4.0"
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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}


# ============================================================================
# PROVIDERS
# ============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}