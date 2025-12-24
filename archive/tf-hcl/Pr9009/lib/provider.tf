# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  # backend "s3" {}  # Disabled for LocalStack testing
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Secondary AWS provider for multi-region setup
provider "aws" {
  alias  = "secondary"
  region = var.bucket_region
}
