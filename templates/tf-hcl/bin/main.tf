terraform {
  backend "s3" {
    bucket         = "iac-rlhf-tf-states"  # varaibles are not allowed in in the backend block var.state_bucket
    key            = "dev/tap-stack.tfstate"  #"${var.environment_suffix}/${var.stack_name}.tfstate"
    region         =  "us-east-1" #var.state_bucket_region
    encrypt        = true
    dynamodb_table = "terraform-locks" # optional for state locking
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

module "s3" {
  source      = "../lib/modules"
  bucket_name = var.s3_bucket_name
}
