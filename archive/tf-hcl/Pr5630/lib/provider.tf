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
    bucket         = "iac-rlhf-tf-states-eu-central-1-342597974367"
    key            = "synth-i03v6/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "iac-rlhf-tf-locks-eu-central-1"
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
