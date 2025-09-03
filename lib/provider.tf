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
#provider "aws" {
#  region = var.aws_region
#}

provider "aws" {
  alias  = "us_east_2"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_1"
  region = var.secondary_region
}
