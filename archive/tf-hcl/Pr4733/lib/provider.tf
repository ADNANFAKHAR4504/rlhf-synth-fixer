# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Default provider (uses primary region)
provider "aws" {
  region = var.primary_region
}

# Primary region provider (explicit alias)
provider "aws" {
  region = var.primary_region
  alias  = "primary"
}

# Secondary region provider
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"
}

# Global provider for Route53 and CloudFront
provider "aws" {
  region = "us-east-1"
  alias  = "global"
}
