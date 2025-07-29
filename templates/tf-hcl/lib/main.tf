terraform {
  backend "s3" {
    bucket         = var.state_bucket
    key            = "${var.environment_suffix}/${var.stack_name}.tfstate"
    region         = var.state_bucket_region
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
