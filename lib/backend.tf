# backend.tf
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket-example"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"

    # Workspace prefix for environment separation
    workspace_key_prefix = "workspaces"
  }
}

