# backend.tf - Terraform backend configuration

terraform {
  backend "s3" {
    bucket  = "iac-rlhf-tf-states"
    key     = "prs/pr1348/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}