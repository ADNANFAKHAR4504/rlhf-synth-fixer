# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for us-east-1
provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

# Secondary AWS provider for us-west-2
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
