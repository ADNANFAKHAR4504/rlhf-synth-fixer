# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "tap-multi-region"
      Environment = "production"
    }
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Project     = "tap-multi-region"
      Environment = "production"
    }
  }
}