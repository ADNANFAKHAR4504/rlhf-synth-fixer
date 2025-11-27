terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        Environment = var.environment_suffix
        Workspace   = terraform.workspace
      }
    )
  }
}
