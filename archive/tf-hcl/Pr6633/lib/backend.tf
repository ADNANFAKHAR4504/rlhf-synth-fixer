terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend configuration
  # The actual values will be provided via -backend-config during init
  backend "s3" {
    # bucket, key, region, and encrypt will be configured during init
  }
}
