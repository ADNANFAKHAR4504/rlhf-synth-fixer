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

# Provider alias for us-east-2 region
provider "aws" {
  alias  = "east"
  region = "us-east-2"
}

# Provider alias for us-west-2 region
provider "aws" {
  alias  = "west"
  region = "us-west-2"
}
