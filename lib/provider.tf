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

# Primary Region Provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "multi-region-ha"
      ManagedBy   = "terraform"
    }
  }
}

# Secondary Region Provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "multi-region-ha"
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