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

  backend "s3" {
    bucket  = "iac-rlhf-tf-states"
    key     = "global/291757/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
