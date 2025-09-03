# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {
    bucket       = "iac-rlhf-states-254123"
    key          = "iac-test-automations/lib/terraform.tfstate"
    region       = "us-west-2"
    use_lockfile = true
    encrypt      = true
    # dynamodb_table = "terraform-locks"  # Optional but recommended for state locking
  }

}

# Primary AWS provider for general resources
provider "aws" {
  region = "us-west-2"
}
  