# provider.tf

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
      Repository        = var.repository
      Author            = var.commit_author
      PRNumber          = var.pr_number
      Team              = var.team
      ManagedBy         = "terraform"
      Project           = var.project_name
    }
  }
}

# Alias provider for the old region (for reference/cleanup operations)
provider "aws" {
  alias  = "old_region"
  region = "us-west-1"

  default_tags {
    tags = {
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
      Repository        = var.repository
      Author            = var.commit_author
      PRNumber          = var.pr_number
      Team              = var.team
      ManagedBy         = "terraform"
      Project           = var.project_name
      Region            = "old"
    }
  }
}
