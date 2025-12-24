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
      version = ">= 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  # backend "s3" {}  # Temporarily disabled for QA testing
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  # LocalStack configuration
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  s3_use_path_style          = true

  endpoints {
    cloudwatch         = "http://localhost:4566"
    ec2                = "http://localhost:4566"
    elb                = "http://localhost:4566"
    elbv2              = "http://localhost:4566"
    autoscaling        = "http://localhost:4566"
    iam                = "http://localhost:4566"
    sts                = "http://localhost:4566"
  }

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Owner       = "DevOps Team"
      CostCenter  = "Engineering"
    }
  }
}
