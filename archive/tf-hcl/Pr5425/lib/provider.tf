# provider.tf

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

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Hub region provider (eu-west-3)
provider "aws" {
  alias  = "hub"
  region = var.hub_region
  default_tags {
    tags = var.common_tags
  }
}

# AP-Northeast-1 spoke provider
provider "aws" {
  alias  = "us_west"
  region = var.spoke_regions["ap-northeast-1"]
  default_tags {
    tags = var.common_tags
  }
}

# US-West-1 spoke provider
provider "aws" {
  alias  = "eu_west"
  region = var.spoke_regions["ap-southeast-2"]
  default_tags {
    tags = var.common_tags
  }
}
