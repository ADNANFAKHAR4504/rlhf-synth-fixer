# provider.tf - LocalStack configuration

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # Use local backend for LocalStack testing
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Primary AWS provider for LocalStack
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    apigateway             = "http://localhost:4566"
    cloudformation         = "http://localhost:4566"
    cloudwatch             = "http://localhost:4566"
    dynamodb               = "http://localhost:4566"
    ec2                    = "http://localhost:4566"
    iam                    = "http://localhost:4566"
    lambda                 = "http://localhost:4566"
    rds                    = "http://localhost:4566"
    s3                     = "http://s3.localhost.localstack.cloud:4566"
    secretsmanager         = "http://localhost:4566"
    sns                    = "http://localhost:4566"
    sqs                    = "http://localhost:4566"
    sts                    = "http://localhost:4566"
    elasticloadbalancingv2 = "http://localhost:4566"
  }

  s3_use_path_style = true
}

# Random provider
provider "random" {}
