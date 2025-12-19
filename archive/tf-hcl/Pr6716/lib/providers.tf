terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration must be provided via backend config file or CLI
  # Example: terraform init -backend-config="bucket=${ENVIRONMENT_SUFFIX}-terraform-state"
  backend "s3" {
    key     = "infrastructure/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

# Primary provider for us-east-1
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

# Secondary provider for us-west-2 using alias
provider "aws" {
  alias  = "west"
  region = "us-west-2"

  default_tags {
    tags = local.common_tags
  }
}