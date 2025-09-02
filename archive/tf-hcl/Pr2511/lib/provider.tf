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
      version = ">= 3.0"
    }
  }

  # Use local state for testing
  backend "s3" {}
}


# Variables
variable "aws_region" {
  description = "AWS region for the primary provider"
  type        = string
  default     = "us-east-1"
}

# Primary AWS provider for general resources
provider "aws" {
  alias  = "primary"
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "production"
      Project     = "MultiRegion-HA"
      ManagedBy   = "Terraform"
    }
  }


}

# Secondary AWS provider for us-west-2 region
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "MultiRegion-HA"
      ManagedBy   = "Terraform"
    }
  }


}
