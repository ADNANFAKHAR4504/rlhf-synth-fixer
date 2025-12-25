terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# LocalStack detection - use environment variable to determine if running locally
locals {
  is_localstack = var.use_localstack
  endpoint_url  = local.is_localstack ? "http://localhost:4566" : null
}

# Default provider for us-east-1
provider "aws" {
  region     = "us-east-1"
  access_key = local.is_localstack ? "test" : null
  secret_key = local.is_localstack ? "test" : null

  # LocalStack endpoint configuration
  skip_credentials_validation = local.is_localstack
  skip_metadata_api_check     = local.is_localstack
  skip_requesting_account_id  = local.is_localstack
  s3_use_path_style          = local.is_localstack

  dynamic "endpoints" {
    for_each = local.is_localstack ? [1] : []
    content {
      iam            = local.endpoint_url
      s3             = local.endpoint_url
      sts            = local.endpoint_url
      cloudformation = local.endpoint_url
    }
  }

  # Note: assume_role configuration commented out for initial deployment
  # Uncomment and configure for cross-account deployments
  # assume_role {
  #   role_arn     = "arn:aws:iam::${var.target_account_id}:role/corp-terraform-deployer"
  #   session_name = "terraform-iam-deployment"
  #   external_id  = var.external_id != "" ? var.external_id : null
  # }

  # Apply consistent tags to all resources - critical for SOC 2 asset management
  default_tags {
    tags = {
      owner   = var.owner
      purpose = var.purpose
      env     = var.env
      # Additional compliance tags
      managed_by   = "terraform"
      compliance   = "soc2-gdpr"
      created_date = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# EU provider alias for eu-west-1 region (disabled for LocalStack single-region setup)
provider "aws" {
  alias      = "eu"
  region     = "eu-west-1"
  access_key = local.is_localstack ? "test" : null
  secret_key = local.is_localstack ? "test" : null

  # LocalStack endpoint configuration
  skip_credentials_validation = local.is_localstack
  skip_metadata_api_check     = local.is_localstack
  skip_requesting_account_id  = local.is_localstack
  s3_use_path_style          = local.is_localstack

  dynamic "endpoints" {
    for_each = local.is_localstack ? [1] : []
    content {
      iam            = local.endpoint_url
      s3             = local.endpoint_url
      sts            = local.endpoint_url
      cloudformation = local.endpoint_url
    }
  }

  # Note: assume_role configuration commented out for initial deployment
  # Uncomment and configure for cross-account deployments
  # assume_role {
  #   role_arn     = "arn:aws:iam::${var.target_account_id}:role/corp-terraform-deployer"
  #   session_name = "terraform-iam-deployment-eu"
  #   external_id  = var.external_id != "" ? var.external_id : null
  # }

  default_tags {
    tags = {
      owner        = var.owner
      purpose      = var.purpose
      env          = var.env
      managed_by   = "terraform"
      compliance   = "soc2-gdpr"
      created_date = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}