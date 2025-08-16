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

# Variable for the default AWS region (used for global resources like IAM)
variable "aws_region" {
  description = "The default AWS region for provider configuration."
  type        = string
  default     = "eu-north-1"
}

# Variable for target regions for deployment
variable "aws_regions" {
  description = "List of AWS regions for multi-region deployment"
  type        = list(string)
  default     = ["eu-north-1", "us-west-2"]
}

# Default provider configuration for non-regional resources like IAM
provider "aws" {
  region = var.aws_region
}

# Provider alias for US East (N. Virginia) region
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# Provider alias for US West (Oregon) region
provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}

# Provider alias for EU North (Stockholm) region
provider "aws" {
  alias  = "eu-north-1"
  region = "eu-north-1"
}

# Provider alias for EU Central (Frankfurt) region
provider "aws" {
  alias  = "eu-central-1"
  region = "eu-central-1"
}
