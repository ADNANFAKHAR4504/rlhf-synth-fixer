# provider.tf

# LocalStack detection
locals {
  is_localstack = var.aws_endpoint_url != "" && (can(regex("localhost", var.aws_endpoint_url)) || can(regex("4566", var.aws_endpoint_url)))
}

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  # LocalStack configuration
  access_key                  = local.is_localstack ? "test" : null
  secret_key                  = local.is_localstack ? "test" : null
  skip_credentials_validation = local.is_localstack
  skip_metadata_api_check     = local.is_localstack
  skip_requesting_account_id  = local.is_localstack
  s3_use_path_style           = local.is_localstack

  dynamic "endpoints" {
    for_each = local.is_localstack ? [1] : []
    content {
      ec2              = var.aws_endpoint_url
      s3               = var.aws_endpoint_url
      iam              = var.aws_endpoint_url
      rds              = var.aws_endpoint_url
      elasticbeanstalk = var.aws_endpoint_url
      elbv2            = var.aws_endpoint_url
      secretsmanager   = var.aws_endpoint_url
      sts              = var.aws_endpoint_url
      kms              = var.aws_endpoint_url
    }
  }
}

# Random provider for generating passwords
provider "random" {}
