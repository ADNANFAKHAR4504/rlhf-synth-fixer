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

# Primary AWS provider for general resources (us-west-2)
provider "aws" {
  alias  = "us_west_2"
  region = var.aws_region
}

# AWS provider for us-east-1 (required for CloudFront certificates and WAF)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

