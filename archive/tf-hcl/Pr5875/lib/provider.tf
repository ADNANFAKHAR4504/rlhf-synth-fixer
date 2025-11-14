# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Backend values are injected by CI
  backend "s3" {}
}

# Default provider (used by resources without an explicit alias)
provider "aws" {
  region = var.aws_region
}

# Alias required by tap_stack.tf (many resources use `provider = aws.use2`)
provider "aws" {
  alias  = "use2"
  region = var.aws_region
}

# Make sure this variable exists in your codebase
variable "aws_region" {
  description = "AWS region to deploy to (e.g., us-east-2)"
  type        = string
}
