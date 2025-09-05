terraform {
  required_version = ">= 1.0"
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
}

# Provider for Dev and Staging (us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Provider for Production (us-west-2)
provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"

  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Random provider for generating passwords and identifiers
provider "random" {}