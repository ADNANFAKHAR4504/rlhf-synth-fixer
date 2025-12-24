# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70" # Pin to 5.x to avoid AWS provider 6.x issues with LocalStack
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  # LocalStack configuration
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

}
