terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }

  backend "s3" {}
}

# Primary region provider
provider "aws" {
  region = var.aws_region_primary
  alias  = "primary"
}

# Secondary region provider
provider "aws" {
  region = var.aws_region_secondary
  alias  = "secondary"
}

# Default provider (primary region)
provider "aws" {
  region = var.aws_region_primary
}

# Route 53 ARC requires us-west-2 for control plane operations
provider "aws" {
  region = "us-west-2"
  alias  = "arc"
}
