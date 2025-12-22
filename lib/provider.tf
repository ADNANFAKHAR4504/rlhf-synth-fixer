# provider.tf - Providers, versions, and backend (no variables here)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # S3 backend configuration for remote state management
  # Values are provided via -backend-config during terraform init
  backend "s3" {
    bucket         = "terraform-state-bucket-name"
    key            = "nova-model-breaking/tfstate/${terraform.workspace}.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock-table"
    encrypt        = true
  }
}

# Default AWS provider using var.aws_region (declared in lib/tap_stack.tf)
provider "aws" {
  region = var.aws_region
}

# Aliased provider for us-east-1
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

# Aliased provider for us-west-2
provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}

# Aliased provider for eu-central-1
provider "aws" {
  alias  = "euc1"
  region = "eu-central-1"
}