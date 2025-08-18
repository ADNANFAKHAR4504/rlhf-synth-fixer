# provider.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

provider "aws" {
  alias  = "us_west"
  region = "us-west-1"

  default_tags {
    tags = local.common_tags
  }
}

# Secondary AWS Provider (eu-central-1)
provider "aws" {
  alias  = "eu_central"
  region = "eu-central-1"

  default_tags {
    tags = local.common_tags
  }
}
