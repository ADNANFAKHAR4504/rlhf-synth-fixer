# provider.tf - Multi-Environment Configuration

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  # Commented out for local testing - uncomment for production use
  # backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
      Project           = var.project_name
      Repository        = var.repository
      Author            = var.commit_author
      PRNumber          = var.pr_number
      Team              = var.team
      ManagedBy         = "terraform"
    }
  }
}
