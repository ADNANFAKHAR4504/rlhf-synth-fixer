terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {


  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment        = var.environment
      DataClassification = "sensitive"
      Owner              = "platform-team"
      ManagedBy          = "terraform"
    }
  }
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment        = var.environment
      DataClassification = "sensitive"
      Owner              = "platform-team"
      ManagedBy          = "terraform"
    }
  }
}

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}