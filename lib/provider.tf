terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = "us-east-2"

  default_tags {
    tags = {
      Environment = "production"
      Owner       = "infrastructure-team"
      Department  = "engineering"
      Project     = "secure-infrastructure"
      ManagedBy   = "terraform"
    }
  }
}
