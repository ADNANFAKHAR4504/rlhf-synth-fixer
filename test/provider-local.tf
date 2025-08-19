# Test provider configuration with local backend
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.2"
    }
  }
  # Use local backend for tests
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  access_key                  = "mock_access_key"
  secret_key                  = "mock_secret_key"
}