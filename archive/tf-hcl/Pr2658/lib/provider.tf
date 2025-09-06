terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Local variables for configuration
locals {
  project     = "tap"
  environment = "dev"
  owner       = "security-team"
  regions     = ["us-east-1", "eu-west-1", "ap-southeast-2"]
  home_region = "us-east-1"

  # Common naming pattern
  name_prefix = "${local.project}-${local.environment}"

  # Common tags applied to all resources
  common_tags = {
    Project     = local.project
    Environment = local.environment
    Owner       = local.owner
    ManagedBy   = "terraform"
  }
}

# Default AWS provider (us-east-1)
provider "aws" {
  region = local.home_region

  default_tags {
    tags = local.common_tags
  }

  # Uncomment for multi-account setup
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.target_account_id}:role/OrganizationAccountAccessRole"
  # }
}

# Regional providers for multi-region deployment
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }

  # Uncomment for multi-account setup
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.target_account_id}:role/OrganizationAccountAccessRole"
  # }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = local.common_tags
  }

  # Uncomment for multi-account setup
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.target_account_id}:role/OrganizationAccountAccessRole"
  # }
}

provider "aws" {
  alias  = "ap_southeast_2"
  region = "ap-southeast-2"

  default_tags {
    tags = local.common_tags
  }

  # Uncomment for multi-account setup
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.target_account_id}:role/OrganizationAccountAccessRole"
  # }
}