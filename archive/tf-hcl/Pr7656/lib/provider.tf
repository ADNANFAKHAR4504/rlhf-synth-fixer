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

# Read AWS region from file, fallback to variable if file doesn't exist
locals {
  aws_region_file = fileexists("${path.module}/AWS_REGION") ? trimspace(file("${path.module}/AWS_REGION")) : null
  aws_region      = local.aws_region_file != null ? local.aws_region_file : var.aws_region
}

# Primary AWS provider for general resources
provider "aws" {
  region = local.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}
