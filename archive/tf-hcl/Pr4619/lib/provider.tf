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
  backend "s3" {}
}

# # Primary AWS provider for general resources
# provider "aws" {
#   region = var.aws_region
# }
provider "aws" {
  alias  = "use2"
  region = "us-east-2"
}

# eu-west-1 alias used by resources: provider = aws.euw1
provider "aws" {
  alias  = "euw2"
  region = "eu-west-2"
}