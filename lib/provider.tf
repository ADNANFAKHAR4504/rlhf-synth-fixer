terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Backend configuration for state management
  backend "s3" {
    # These values should be configured during terraform init
    # bucket = "your-terraform-state-bucket"
    # key    = "terraform.tfstate"
    # region = "us-west-2"
    # dynamodb_table = "terraform-locks"
    # encrypt = true
  }
}

# Local values for environment configuration
locals {
  # Environment mapping based on workspace
  environment_config = {
    staging-us-west-2 = {
      environment = "staging"
      region      = "us-west-2"
      short_name  = "stg"
    }
    staging-eu-west-1 = {
      environment = "staging"
      region      = "eu-west-1"
      short_name  = "stg"
    }
    production-us-west-2 = {
      environment = "production"
      region      = "us-west-2"
      short_name  = "prod"
    }
    production-eu-west-1 = {
      environment = "production"
      region      = "eu-west-1"
      short_name  = "prod"
    }
  }
  
  # Current environment configuration
  current_env = local.environment_config[terraform.workspace]
  
  # Consistent naming convention
  name_prefix = "${local.current_env.environment}-${replace(local.current_env.region, "-", "")}"
  
  # Common tags applied to all resources
  common_tags = {
    Environment   = local.current_env.environment
    Region       = local.current_env.region
    Workspace    = terraform.workspace
    ManagedBy    = "terraform"
    Project      = "tap-stack"
  }
}

# Primary AWS Provider
provider "aws" {
  region = local.current_env.region
  
  default_tags {
    tags = local.common_tags
  }
}

# Data source to get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Validation to ensure workspace exists in configuration
resource "null_resource" "workspace_validation" {
  count = contains(keys(local.environment_config), terraform.workspace) ? 0 : 1
  
  provisioner "local-exec" {
    command = "echo 'Error: Workspace ${terraform.workspace} is not configured. Valid workspaces: ${join(", ", keys(local.environment_config))}' && exit 1"
  }
}