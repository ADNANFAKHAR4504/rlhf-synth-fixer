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

provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        Environment = var.environment_suffix
        Region      = var.primary_region
        DR-Role     = "primary"
        Repository  = var.repository
        Author      = var.commit_author
        PRNumber    = var.pr_number
        Team        = var.team
      }
    )
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        Environment = var.environment_suffix
        Region      = var.secondary_region
        DR-Role     = "secondary"
        Repository  = var.repository
        Author      = var.commit_author
        PRNumber    = var.pr_number
        Team        = var.team
      }
    )
  }
}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}
