terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Use S3 backend for this deployment
  backend "s3" {}
}

provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        ManagedBy         = "Terraform"
        EnvironmentSuffix = var.environment_suffix
        Project           = "BlueGreenDeployment"
      }
    )
  }
}
