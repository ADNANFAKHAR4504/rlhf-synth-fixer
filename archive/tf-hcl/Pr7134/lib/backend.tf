# Backend configuration for remote state management
# For QA testing, we use local state. In production, configure S3 backend.
terraform {
  # Using local backend for testing - comment out for production use
  # backend "s3" {
  #   bucket         = var.terraform_state_bucket  # Must be provided via environment variable
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = var.region
  #   dynamodb_table = var.terraform_state_lock_table
  #   encrypt        = true
  #
  #   # Workspace-based state separation
  #   workspace_key_prefix = "workspaces"
  # }
}
