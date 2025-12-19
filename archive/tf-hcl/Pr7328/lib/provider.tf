terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Region      = "primary"
      DR-Role     = "primary"
      Project     = "transaction-processing"
      ManagedBy   = "terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Region      = "secondary"
      DR-Role     = "secondary"
      Project     = "transaction-processing"
      ManagedBy   = "terraform"
    }
  }
}
