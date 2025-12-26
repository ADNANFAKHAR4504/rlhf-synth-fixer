terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

# LocalStack detection
locals {
  is_localstack = can(regex("localhost|4566", var.aws_endpoint_url))
}

variable "aws_endpoint_url" {
  description = "AWS endpoint URL for LocalStack"
  type        = string
  default     = ""
}

# Primary AWS provider configured for LocalStack
provider "aws" {
  region = var.aws_region

  # LocalStack endpoint configuration
  access_key                  = local.is_localstack ? "test" : null
  secret_key                  = local.is_localstack ? "test" : null
  skip_credentials_validation = local.is_localstack ? true : false
  skip_metadata_api_check     = local.is_localstack ? true : false
  skip_requesting_account_id  = local.is_localstack ? true : false
  s3_use_path_style           = local.is_localstack ? true : false

  endpoints {
    apigateway     = local.is_localstack ? var.aws_endpoint_url : null
    cloudformation = local.is_localstack ? var.aws_endpoint_url : null
    cloudtrail     = local.is_localstack ? var.aws_endpoint_url : null
    cloudwatch     = local.is_localstack ? var.aws_endpoint_url : null
    cloudwatchlogs = local.is_localstack ? var.aws_endpoint_url : null
    dynamodb       = local.is_localstack ? var.aws_endpoint_url : null
    ec2            = local.is_localstack ? var.aws_endpoint_url : null
    iam            = local.is_localstack ? var.aws_endpoint_url : null
    kms            = local.is_localstack ? var.aws_endpoint_url : null
    lambda         = local.is_localstack ? var.aws_endpoint_url : null
    s3             = local.is_localstack ? var.aws_endpoint_url : null
    secretsmanager = local.is_localstack ? var.aws_endpoint_url : null
    sns            = local.is_localstack ? var.aws_endpoint_url : null
    sqs            = local.is_localstack ? var.aws_endpoint_url : null
    ssm            = local.is_localstack ? var.aws_endpoint_url : null
    sts            = local.is_localstack ? var.aws_endpoint_url : null
  }
}

# Null provider for cleanup operations
provider "null" {}

# Random provider for generating unique names
provider "random" {}
