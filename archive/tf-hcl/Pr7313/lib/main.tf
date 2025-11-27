terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Backend configuration for state management
  # Partial backend config: values are injected at terraform init time via -backend-config
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      var.tags,
      {
        EnvironmentSuffix = local.env_suffix
      }
    )
  }
}

# Random string for environment suffix if not provided
resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : (length(random_string.environment_suffix) > 0 ? random_string.environment_suffix[0].result : "dev")
}

# Random string for unique resource naming to avoid conflicts
resource "random_string" "unique_suffix" {
  length  = 6
  special = false
  upper   = false
  lower   = true
  numeric = true
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
