terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}

# DR region provider (us-west-2)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = var.common_tags
  }
}

# Default provider (primary region)
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}
