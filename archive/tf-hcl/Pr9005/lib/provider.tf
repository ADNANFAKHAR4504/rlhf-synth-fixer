# provider.tf - Provider configurations and version constraints

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

# Primary Region Provider
provider "aws" {
  alias  = "primary"
  region = var.aws_region_primary

  # LocalStack endpoint configuration
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = "multi-region-ha-${var.environment_suffix}"
      ManagedBy   = "terraform"
    }
  }
}

# Secondary Region Provider
provider "aws" {
  alias  = "secondary"
  region = var.aws_region_secondary

  # LocalStack endpoint configuration
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = "multi-region-ha-${var.environment_suffix}"
      ManagedBy   = "terraform"
    }
  }
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}