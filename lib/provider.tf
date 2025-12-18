# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      # Pin to a known-stable 5.x to reduce LocalStack quirks.
      # (>=5.0 sometimes pulls newer versions that break certain LocalStack calls)
      version = "~> 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time by scripts/localstack-ci-deploy.sh
  backend "s3" {}
}

# Primary AWS provider for LocalStack
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"

  # LocalStack-safe flags
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Force path-style S3 (important for LocalStack)
  s3_use_path_style           = true

  # Route AWS APIs to LocalStack edge port
  endpoints {
    s3            = "http://localhost:4566"
    iam           = "http://localhost:4566"
    ec2           = "http://localhost:4566"
    kms           = "http://localhost:4566"
    sts           = "http://localhost:4566"
    cloudwatch    = "http://localhost:4566"
    logs          = "http://localhost:4566"
    events        = "http://localhost:4566"
    dynamodb      = "http://localhost:4566"
    lambda        = "http://localhost:4566"
    apigateway    = "http://localhost:4566"
    ssm           = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
  }
}
