# provider.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    # Backend config values (bucket, key, region, etc.) are set via CLI or environment variables at `terraform init`
  }
}

provider "aws" {
  region = var.aws_region
}
