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

  backend "s3" {
    bucket         = "iac-tfstate-us-east-1"     # 👈 replace with your S3 bucket name
    key            = "env/dev/terraform.tfstate" # 👈 state file path inside the bucket
    region         = "us-east-1"                 # 👈 must match your bucket’s region
    dynamodb_table = "terraform-locks"           # 👈 optional but recommended for state locking
    encrypt        = true
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
