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
      version = ">= 3.1"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for us-east-1 (main region)
provider "aws" {
  region = var.aws_region
  alias  = "east"
}

# Secondary AWS provider for us-west-2 (disaster recovery region)
provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

# Default provider (for backward compatibility with existing resources)
provider "aws" {
  region = var.aws_region
}
