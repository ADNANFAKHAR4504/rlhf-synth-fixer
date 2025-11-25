terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

# Data sources for account and region information
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Local variables
locals {
  account_id         = data.aws_caller_identity.current.account_id
  config_bucket_name = "config-compliance-${var.environment_suffix}-${local.account_id}"

  compliance_rules = {
    encryption = "check-encryption-compliance"
    tagging    = "check-tagging-compliance"
    backup     = "check-backup-compliance"
  }
}
