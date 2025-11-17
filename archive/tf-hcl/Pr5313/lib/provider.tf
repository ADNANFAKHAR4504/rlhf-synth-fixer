terraform {
  required_version = ">= 1.5.0"

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

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  alias  = "hub"
}

provider "aws" {
  region = "us-west-2"
  alias  = "us_west"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "europe"
}

provider "aws" {
  region = var.aws_region
}
