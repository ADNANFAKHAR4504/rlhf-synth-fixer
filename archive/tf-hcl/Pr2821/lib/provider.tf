# provider.tf - AWS Provider Configuration

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Environment   = "production"
      Owner         = "security-team"
      SecurityLevel = "high"
      ManagedBy     = "terraform"
    }
  }
}
