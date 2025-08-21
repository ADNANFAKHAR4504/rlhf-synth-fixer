terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Default provider for us-east-1
provider "aws" {
  region = "us-east-1"

  # Note: assume_role configuration commented out for initial deployment
  # Uncomment and configure for cross-account deployments
  # assume_role {
  #   role_arn     = "arn:aws:iam::${var.target_account_id}:role/corp-terraform-deployer"
  #   session_name = "terraform-iam-deployment"
  #   external_id  = var.external_id != "" ? var.external_id : null
  # }

  # Apply consistent tags to all resources - critical for SOC 2 asset management
  default_tags {
    tags = {
      owner   = var.owner
      purpose = var.purpose
      env     = var.env
      # Additional compliance tags
      managed_by   = "terraform"
      compliance   = "soc2-gdpr"
      created_date = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# EU provider alias for eu-west-1 region
provider "aws" {
  alias  = "eu"
  region = "eu-west-1"

  # Note: assume_role configuration commented out for initial deployment
  # Uncomment and configure for cross-account deployments
  # assume_role {
  #   role_arn     = "arn:aws:iam::${var.target_account_id}:role/corp-terraform-deployer"
  #   session_name = "terraform-iam-deployment-eu"
  #   external_id  = var.external_id != "" ? var.external_id : null
  # }

  default_tags {
    tags = {
      owner        = var.owner
      purpose      = var.purpose
      env          = var.env
      managed_by   = "terraform"
      compliance   = "soc2-gdpr"
      created_date = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}