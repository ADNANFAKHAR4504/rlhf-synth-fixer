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
}

# Conditional AWS provider based on current environment
provider "aws" {
  region = local.current_env_config.region
  default_tags {
    tags = {
      environment = local.env
      project     = var.project_name
      managed_by  = "terraform"
    }
  }
}

# Staging environment provider (for explicit staging deployments)
provider "aws" {
  alias  = "staging"
  region = var.staging_region
  default_tags {
    tags = {
      environment = var.environment_names.staging
      project     = var.project_name
      managed_by  = "terraform"
    }
  }
}

# Production environment provider (for explicit production deployments)
provider "aws" {
  alias  = "production"
  region = var.production_region
  default_tags {
    tags = {
      environment = var.environment_names.production
      project     = var.project_name
      managed_by  = "terraform"
    }
  }
}

# Random provider
provider "random" {
  # Random provider configuration
}
