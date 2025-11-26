# Main Terraform configuration for multi-region DR
terraform {
  required_version = ">= 1.5"
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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary region provider (us-east-1)
provider "aws" {
  region = var.primary_region
  alias  = "primary"
}

# Secondary region provider (us-west-2)
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}