# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70.0"
    }
  }

  # Using local backend for LocalStack testing
  backend "local" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
  
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  
  endpoints {
    s3                 = "http://localhost:4566"
    ec2                = "http://localhost:4566"
    elbv2              = "http://localhost:4566"
    autoscaling        = "http://localhost:4566"
    iam                = "http://localhost:4566"
    sts                = "http://localhost:4566"
    cloudwatch         = "http://localhost:4566"
  }
}
