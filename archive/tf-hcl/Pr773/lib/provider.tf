# /-----------------------------------------------------------------------------
# | Terraform & Provider Configuration
# |-----------------------------------------------------------------------------
terraform {
  # This backend block is required by your CI/CD pipeline.
  # The configuration is passed in dynamically during initialization.
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variable for the default AWS region.
variable "aws_region" {
  description = "The default AWS region for provider configuration."
  type        = string
  default     = "us-west-2"
}

# Default provider configuration for non-regional resources like IAM.
provider "aws" {
  region = var.aws_region
}

# Provider alias for the US East (N. Virginia) region.
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# Provider alias for the US West (Oregon) region.
provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
