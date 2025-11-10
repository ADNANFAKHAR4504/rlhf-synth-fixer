# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_west_2"
  region = var.aws_region
}
