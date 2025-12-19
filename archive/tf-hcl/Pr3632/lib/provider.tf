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

# Provider for Primary Region
provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

# Provider for Secondary Region
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

# Provider for Route53 (Global)
provider "aws" {
  alias  = "route53"
  region = "eu-west-1"
}