# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Local values for region mapping (needs to be here to be used by provider)
locals {
  region_map = {
    dev     = "eu-west-1"
    staging = "us-west-2"
    prod    = "us-east-1"
  }
  selected_region = lookup(local.region_map, var.environment, "us-east-1")
}

# Primary AWS provider for general resources
provider "aws" {
  region = local.selected_region

  default_tags {
    tags = {
      Environment = var.environment
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}
