# backend.tf - Terraform backend configuration
# Disabled S3 backend for LocalStack testing - using local backend

terraform {
  # backend "s3" {
  #   # These values will be provided via -backend-config during initialization
  #   # bucket = "iac-rlhf-tf-states"
  #   # key    = "prs/pr1348/terraform.tfstate"
  #   # region = "us-east-1"
  #   # encrypt = true
  #   # use_lockfile = true
  # }
}