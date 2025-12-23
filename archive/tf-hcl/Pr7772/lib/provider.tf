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

  default_tags {
    tags = local.common_tags
  }
}

locals {
  project_name = var.project_name
  environment  = var.environment
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
    ManagedBy   = "Terraform"
    Region      = local.region
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
  }
}

# Data sources that depend on the provider
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
