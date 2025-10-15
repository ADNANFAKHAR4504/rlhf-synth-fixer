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
      version = "~> 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources (us-east-1)
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# Secondary AWS provider for us-west-2
provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
