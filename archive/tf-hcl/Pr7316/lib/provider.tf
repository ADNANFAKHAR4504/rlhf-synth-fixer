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

  backend "s3" {}
}


# Generate a random suffix to avoid resource naming conflicts
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Primary region provider
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = var.common_tags
  }
}
