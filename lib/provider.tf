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
      version = ">= 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}


# Provider configurations
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = var.common_tags
  }
}

# Provider for CloudFront and ACM (must be us-east-1)
provider "aws" {
  alias  = "cloudfront"
  region = "us-east-1"

  default_tags {
    tags = var.common_tags
  }
}