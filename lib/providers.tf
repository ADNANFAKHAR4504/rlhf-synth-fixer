terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary AWS provider for LocalStack (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  # LocalStack configuration
  access_key = "test"
  secret_key = "test"

  # LocalStack endpoints (only used when provider = localstack)
  endpoints {
    s3             = "http://s3.localhost.localstack.cloud:4566"
    dynamodb       = "http://localhost:4566"
    rds            = "http://localhost:4566"
    route53        = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    sns            = "http://localhost:4566"
    iam            = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    elbv2          = "http://localhost:4566"
    vpc            = "http://localhost:4566"
  }

  # LocalStack-safe flags
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Force path-style S3 (important for LocalStack)
  s3_use_path_style = true
}

# DR AWS provider for LocalStack (us-west-2)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  # LocalStack configuration
  access_key = "test"
  secret_key = "test"

  # LocalStack endpoints (only used when provider = localstack)
  endpoints {
    s3             = "http://s3.localhost.localstack.cloud:4566"
    dynamodb       = "http://localhost:4566"
    rds            = "http://localhost:4566"
    route53        = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    sns            = "http://localhost:4566"
    iam            = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    elbv2          = "http://localhost:4566"
    vpc            = "http://localhost:4566"
  }

  # LocalStack-safe flags
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Force path-style S3 (important for LocalStack)
  s3_use_path_style = true
}

# Global AWS provider for LocalStack (Route53)
provider "aws" {
  alias  = "global"
  region = var.primary_region

  # LocalStack configuration
  access_key = "test"
  secret_key = "test"

  # LocalStack endpoints (only used when provider = localstack)
  endpoints {
    s3             = "http://s3.localhost.localstack.cloud:4566"
    dynamodb       = "http://localhost:4566"
    rds            = "http://localhost:4566"
    route53        = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    sns            = "http://localhost:4566"
    iam            = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    elbv2          = "http://localhost:4566"
    vpc            = "http://localhost:4566"
  }

  # LocalStack-safe flags
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Force path-style S3 (important for LocalStack)
  s3_use_path_style = true
}
