terraform {
  required_version = ">= 1.5.0"

  # backend config: values are injected at `terraform init` time
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# ============================================================================
# PROVIDERS - Multi-region configuration
# ============================================================================

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = local.common_tags
  }
}