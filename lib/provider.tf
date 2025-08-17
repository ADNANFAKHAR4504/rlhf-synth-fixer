# /lib/provider.tf

# Specifies the required Terraform version and the AWS provider configuration.
# Using a version constraint is a best practice to ensure predictable behavior.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Provider configuration for the primary region (us-east-1).
# This will be the default provider for any resource that does not have an explicit 'provider' alias set.
provider "aws" {
  region = "us-east-1"
}

# Alias provider for the primary region (us-east-1).
# This allows us to explicitly target this region for resource creation.
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

# Alias provider for the secondary/failover region (us-west-2).
# We must explicitly use 'provider = aws.secondary' for all resources deployed here.
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}
