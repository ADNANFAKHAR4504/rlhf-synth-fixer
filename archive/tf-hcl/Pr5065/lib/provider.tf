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

# Provider aliases for multi-region deployment
provider "aws" {
  alias  = "us_east_1"
  region = var.us_east_1_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.us_west_2_region
}
