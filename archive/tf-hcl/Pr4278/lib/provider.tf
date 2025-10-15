# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for the main account
provider "aws" {
  region = var.primary_region
}

# Aliased providers for peer accounts (dynamically configured)
# These will be used for cross-account VPC peering
# Note: These are configured for cross-account access when account_id_map is provided
provider "aws" {
  alias  = "account1"
  region = var.primary_region

  assume_role {
    role_arn = "arn:aws:iam::${lookup(var.account_id_map, 0, data.aws_caller_identity.current.account_id)}:role/${var.cross_account_role_name}"
  }
}

provider "aws" {
  alias  = "account2"
  region = var.primary_region

  assume_role {
    role_arn = "arn:aws:iam::${lookup(var.account_id_map, 1, data.aws_caller_identity.current.account_id)}:role/${var.cross_account_role_name}"
  }
}

provider "aws" {
  alias  = "account3"
  region = var.primary_region

  assume_role {
    role_arn = "arn:aws:iam::${lookup(var.account_id_map, 2, data.aws_caller_identity.current.account_id)}:role/${var.cross_account_role_name}"
  }
}

# Data source for current account ID
data "aws_caller_identity" "current" {}
