# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {
    bucket = "myowntfbucketstate"
    encrypt = true
    key = "blacreetfstate"
    region = "us-east-1"
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
