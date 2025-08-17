terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider for us-east-1
provider "aws" {
  region = "us-east-1"
}

# Secondary provider for eu-west-1
provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}