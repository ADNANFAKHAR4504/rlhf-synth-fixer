# S3 Backend Configuration
# This file contains the backend configuration for Terraform

bucket         = "tap-terraform-state-new-2024"
key            = "tap-stack/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-state-lock"
