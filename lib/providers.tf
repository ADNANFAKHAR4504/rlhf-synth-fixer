terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend configuration for remote state management
  # Backend configuration can be passed via -backend-config flags during init
  backend "s3" {
    # Configuration will be provided via -backend-config flags:
    # -backend-config=bucket=<bucket-name>
    # -backend-config=key=<state-key>
    # -backend-config=region=<region>
    # -backend-config=encrypt=<true|false>
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}
