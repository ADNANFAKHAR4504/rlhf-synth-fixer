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
      version = "~> 3.1"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  # backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  # LocalStack-specific configuration
  skip_credentials_validation = var.is_localstack
  skip_metadata_api_check     = var.is_localstack
  skip_requesting_account_id  = var.is_localstack
  s3_use_path_style           = var.is_localstack

  # Endpoint configuration is handled via AWS_ENDPOINT_URL environment variable
}
