# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# US East 1 provider
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

# US West 2 provider
provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}