terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Primary provider for us-west-1
provider "aws" {
  region = "us-west-1"
}

# Secondary provider for eu-central-1
provider "aws" {
  alias  = "eu_central_1"
  region = "eu-central-1"
}