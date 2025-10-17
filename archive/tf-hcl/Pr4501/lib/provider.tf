# provider.tf

variable "aws_region" {
  description = "The primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "The DR AWS region"
  type        = string
  default     = "us-west-2"
}

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Primary AWS provider alias for cross-region DR setup
provider "aws" {
  alias  = "primary"
  region = var.aws_region
}

# DR AWS provider alias for cross-region DR setup
provider "aws" {
  alias  = "dr"
  region = var.dr_region
}
