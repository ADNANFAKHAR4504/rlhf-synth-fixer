# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.4"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {} # Commented out for QA testing
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
