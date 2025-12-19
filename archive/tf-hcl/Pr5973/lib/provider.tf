# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # S3 backend for remote state management
  backend "s3" {
    # Backend configuration will be provided via -backend-config flags during init
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Project     = "WebhookProcessing"
      Environment = var.environment_suffix
    }
  }
}
