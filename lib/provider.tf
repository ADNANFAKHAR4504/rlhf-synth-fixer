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
  backend "s3" {
    bucket         = "iac-rlhf-tf-states"
    key            = "global/terraform.tfstate"
    region         = "us-east-1"
   # dynamodb_table = "iac-rlhf-tf-locks" # optional for state locking
    encrypt        = true
  }
# Primary AWS provider for general resources
provider "aws" {
  region = var.region
}
