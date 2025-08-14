terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # Backend configuration - will be configured via backend.conf file
  /**
    TF_INIT_OPTS="-backend-config=backend.conf" npm run tf:init
  */
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Null provider for cleanup operations
provider "null" {}

# Random provider for generating unique names
provider "random" {}
