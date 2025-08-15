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
      version = "~> 3.5"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Provider for the primary region: us-east-1 (N. Virginia)
provider "aws" {
  region = "us-east-1"
  alias  = "useast1"
}

# Provider for the secondary/DR region: us-west-2 (Oregon)
provider "aws" {
  region = "us-west-2"
  alias  = "uswest2"
}
