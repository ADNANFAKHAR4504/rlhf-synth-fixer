terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {
    bucket         = "iac-rlhf-tf-states"      # Central S3 bucket for all TF states
    key            = "global/292065/terraform.tfstate"  # Path in bucket
    region         = "us-west-2"              # Region of S3 bucket
    encrypt        = true
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy = "terraform"
      Project   = "iac-aws-nova-model"
      Environment = var.environment
      EnvironmentSuffix = var.environment_suffix
    }
  }
}
