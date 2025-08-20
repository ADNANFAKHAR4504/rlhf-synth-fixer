# /-----------------------------------------------------------------------------
# | Terraform & Provider Configuration
# |-----------------------------------------------------------------------------

terraform {

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Default provider for non-regional resources like IAM.
provider "aws" {
  region = "eu-north-1"
}

# Provider alias for the EU North (Stockholm) region.
provider "aws" {
  alias  = "eu-north-1"
  region = "eu-north-1"
}

# Provider alias for the US West (Oregon) region.
provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
