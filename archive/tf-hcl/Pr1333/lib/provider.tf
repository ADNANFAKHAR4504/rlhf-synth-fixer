terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "tap-stack"
      ManagedBy   = "terraform"
    }
  }
}