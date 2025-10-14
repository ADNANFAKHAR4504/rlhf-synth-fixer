provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project
      ManagedBy   = "Terraform"
    }
  }
}

terraform {
  backend "s3" {
    # Backend configuration will be provided via command line arguments
    # -backend-config="bucket=$TERRAFORM_STATE_BUCKET"
    # -backend-config="key=$TERRAFORM_STATE_BUCKET_KEY/terraform.tfstate"
    # -backend-config="region=$TERRAFORM_STATE_BUCKET_REGION"
    # -backend-config="encrypt=true"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}
