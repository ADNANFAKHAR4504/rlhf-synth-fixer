terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  # Partial backend config: values are injected at terraform init time
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({
      Environment = var.environment_suffix
      Project     = var.project_name
      ManagedBy   = "terraform"
    }, var.tags)
  }
}
