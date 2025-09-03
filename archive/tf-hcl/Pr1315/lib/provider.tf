# provider.tf

terraform {
  required_version = ">= 0.14"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }

  }

  # Partial backend config: values are injected at `terraform init` time
  # Recommended: Add DynamoDB table for state locking
  # backend "s3" {
  #   # bucket         = "terraform-state-bucket"
  #   # key            = "security-config/terraform.tfstate"
  #   # region         = "us-east-1"
  #   # dynamodb_table = "terraform-state-lock"
  #   # encrypt        = true
  # }
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "SecurityConfigurationAsCode"
    }
  }
}
