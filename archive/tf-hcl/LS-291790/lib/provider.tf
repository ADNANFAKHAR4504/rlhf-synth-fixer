terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# LocalStack-compatible provider configuration
provider "aws" {
  region = var.aws_region

  # LocalStack endpoint configuration
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style          = true

  endpoints {
    apigateway      = "http://localhost:4566"
    apigatewayv2    = "http://localhost:4566"
    cloudformation  = "http://localhost:4566"
    cloudwatch      = "http://localhost:4566"
    cloudwatchlogs  = "http://localhost:4566"
    cloudtrail      = "http://localhost:4566"
    dynamodb        = "http://localhost:4566"
    ec2             = "http://localhost:4566"
    elasticloadbalancing = "http://localhost:4566"
    elasticloadbalancingv2 = "http://localhost:4566"
    iam             = "http://localhost:4566"
    kms             = "http://localhost:4566"
    lambda          = "http://localhost:4566"
    rds             = "http://localhost:4566"
    s3              = "http://localhost:4566"
    secretsmanager  = "http://localhost:4566"
    sns             = "http://localhost:4566"
    sqs             = "http://localhost:4566"
    ssm             = "http://localhost:4566"
    sts             = "http://localhost:4566"
    autoscaling     = "http://localhost:4566"
  }

  default_tags {
    tags = {
      Environment = "production"
      Owner       = "infrastructure-team"
      Department  = "engineering"
      Project     = "secure-infrastructure"
      ManagedBy   = "terraform"
      Provider    = "localstack"
    }
  }
}

provider "random" {}
