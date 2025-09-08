# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  # Default tags for all resources
  default_tags {
    tags = {
      ManagedBy     = "Terraform"
      Compliance    = "HIPAA"
      SecurityLevel = "Healthcare"
    }
  }
}

# Random provider for generating suffixes and passwords
provider "random" {}
