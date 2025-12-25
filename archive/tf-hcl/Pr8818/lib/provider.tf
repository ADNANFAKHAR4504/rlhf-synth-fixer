terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend "s3" {}  # Commented out for local testing
}

# Primary provider - region determined by workspace
provider "aws" {
  alias  = "primary"
  region = terraform.workspace == "primary" ? "us-east-1" : "eu-west-1"

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
      Workspace   = terraform.workspace
      Region      = terraform.workspace == "primary" ? "us-east-1" : "eu-west-1"
    }
  }
}

# Secondary provider - opposite region
provider "aws" {
  alias  = "secondary"
  region = terraform.workspace == "primary" ? "eu-west-1" : "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
      Workspace   = terraform.workspace
      Region      = terraform.workspace == "primary" ? "eu-west-1" : "us-east-1"
    }
  }
}

# IAM provider - always us-east-1 for global resources
provider "aws" {
  alias  = "iam"
  region = "us-east-1"

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

# Route53 provider - always us-east-1 for global DNS
provider "aws" {
  alias  = "route53"
  region = "us-east-1"
}
