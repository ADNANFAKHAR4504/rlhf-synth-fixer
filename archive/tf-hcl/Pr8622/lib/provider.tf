# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # S3 backend configuration for remote state storage
  backend "s3" {
    # Backend configuration parameters will be provided via -backend-config flags
    # during terraform init in the deployment/destroy scripts
    # This includes: bucket, key, region, etc.
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
