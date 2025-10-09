# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
      configuration_aliases = [aws.secondary]
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Secondary region provider for DR
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
