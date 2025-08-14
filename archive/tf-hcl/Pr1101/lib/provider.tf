# provider.tf - Provider configuration and Terraform requirements

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  # Optional: Configure remote backend for state management
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "secure-environment/terraform.tfstate"
  #   region         = "us-west-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = "us-west-2" # Change to your preferred region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Environment = "Production"
      Owner       = "SecurityTeam"
      Project     = "SecureEnvironment"
      ManagedBy   = "Terraform"
      CreatedBy   = "RootModule"
    }
  }
}