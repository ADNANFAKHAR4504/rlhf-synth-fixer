terraform {
  required_version = ">= 1.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Purpose     = "Legal Document Storage"
      Compliance  = "Legal Retention Policy"
    }
  }
}

# Secondary provider for cross-region replication
provider "aws" {
  alias  = "replication"
  region = var.replication_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Purpose     = "Legal Document Storage - Replication"
      Compliance  = "Legal Retention Policy"
    }
  }
}
