# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  backend "s3" {}
}

# Default provider (used when a single-region run is performed)
provider "aws" {
  region = var.aws_region
}

# Aliased providers for multi-region deployments (supports up to 3 regions)
provider "aws" {
  alias  = "r0"
  region = try(local.regions_padded[0], var.aws_region)
}

provider "aws" {
  alias  = "r1"
  region = try(local.regions_padded[1], var.aws_region)
}

provider "aws" {
  alias  = "r2"
  region = try(local.regions_padded[2], var.aws_region)
}
