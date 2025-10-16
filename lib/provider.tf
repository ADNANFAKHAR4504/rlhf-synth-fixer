terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {
    bucket         = var.state_bucket
    key            = "${var.environment}/${var.state_key}"
    region         = var.state_region
    encrypt        = true
    dynamodb_table = var.state_lock_table
  }
}

# Primary region provider
provider "aws" {
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "trading-platform"
    }
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "iac232-trading"
    }
  }
}