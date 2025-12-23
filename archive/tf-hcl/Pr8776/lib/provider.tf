terraform {
  # backend "s3" {}  # Commented out for LocalStack compatibility

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    # Added the tls provider to generate a private key for the EC2 instances.
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

# Provider configuration for the primary region (us-east-1).
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

# Provider alias for the secondary/failover region (us-west-2).
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}
