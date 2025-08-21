terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment       = var.environment
      Project           = var.project_name
      ManagedBy         = "Terraform"
      EnvironmentSuffix = var.environment_suffix != "" ? var.environment_suffix : "default"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Locals for naming convention
locals {
  name_prefix = var.environment_suffix != "" ? "${var.project_name}-${var.environment_suffix}" : var.project_name
}