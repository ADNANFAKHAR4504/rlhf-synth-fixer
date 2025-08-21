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
      version = "~> 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Staging environment provider
provider "aws" {
  alias  = "staging"
  region = var.staging_region
  default_tags {
    tags = {
      environment = "staging"
      project     = "IaC - AWS Nova Model Breaking"
    }
  }
}

# Production environment provider
provider "aws" {
  alias  = "production"
  region = var.production_region
  default_tags {
    tags = {
      environment = "production"
      project     = "IaC - AWS Nova Model Breaking"
    }
  }
}

# Random provider
provider "random" {
  # Random provider configuration
}
