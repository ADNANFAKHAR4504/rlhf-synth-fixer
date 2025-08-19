terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "local" {}
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "ap-northeast-1"
  region = "ap-northeast-1"
}
