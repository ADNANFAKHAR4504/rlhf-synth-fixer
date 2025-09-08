terraform {
  required_version = ">= 1.0"

  backend "s3" {
    # Configuration will be provided via backend-config arguments
    # bucket, key, region, encrypt, etc. will be set via CLI
  }

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

# Default AWS provider (us-east-1)
provider "aws" {
  region = "us-east-1"

  # Uncomment and configure if using assume role with jumphost
  # assume_role {
  #   role_arn     = "arn:aws:iam::ACCOUNT-ID:role/TerraformRole"
  #   session_name = "terraform-session"
  # }

  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Provider for Dev and Staging (us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  # Uncomment and configure if using assume role with jumphost
  # assume_role {
  #   role_arn     = "arn:aws:iam::ACCOUNT-ID:role/TerraformRole"
  #   session_name = "terraform-session"
  # }

  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Provider for Production (us-west-2)
provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"

  # Uncomment and configure if using assume role with jumphost
  # assume_role {
  #   role_arn     = "arn:aws:iam::ACCOUNT-ID:role/TerraformRole"
  #   session_name = "terraform-session"
  # }

  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Random provider for generating passwords and identifiers
provider "random" {}
