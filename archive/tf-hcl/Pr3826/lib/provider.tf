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
      version = ">= 3.5"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Primary region provider alias for multi-region DR setup
provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

# Secondary region provider alias for multi-region DR setup
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
