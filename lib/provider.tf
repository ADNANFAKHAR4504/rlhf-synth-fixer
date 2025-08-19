# provider.tf
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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary region provider
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = local.common_tags
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = local.common_tags
  }
}