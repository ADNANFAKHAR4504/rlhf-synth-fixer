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

provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

# provider "aws" {
#   alias  = "logging"
#   region = "us-west-2"
#   # Assume role or use profile for centralized logging account
#   assume_role {
#     role_arn = "arn:aws:iam::${var.logging_account_id}:role/CrossAccountCloudTrailRole"
#   }
# }
