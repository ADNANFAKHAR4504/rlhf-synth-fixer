# backend.tf
# S3 backend configuration for Terraform state management

terraform {
  required_version = ">= 1.4.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    # Configuration will be provided via backend-config during terraform init
    # Example: terraform init -backend-config="bucket=iac-rlhf-tf-states"
  }
}
