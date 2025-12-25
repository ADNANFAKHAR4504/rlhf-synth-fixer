terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.42.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  # LocalStack endpoint configuration
  # These settings are automatically configured by tflocal when used
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  default_tags {
    tags = var.common_tags
  }
}
