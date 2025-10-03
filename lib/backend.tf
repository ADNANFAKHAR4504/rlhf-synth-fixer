# backend.tf
# Terraform backend configuration for state management
# Note: Real credentials should never be committed to version control

terraform {
  backend "s3" {
    # S3 bucket for storing Terraform state
    bucket = "serverless-app-terraform-state-ACCOUNT_ID"

    # State file key - separate keys for source and target regions during migration
    key    = "serverless-app/us-west-2/terraform.tfstate"

    # Region where the state bucket is located
    region = "us-west-2"

    # DynamoDB table for state locking
    dynamodb_table = "terraform-state-lock"

    # Enable encryption at rest for state file
    encrypt = true

    # KMS key for state file encryption (optional)
    # kms_key_id = "arn:aws:kms:us-west-2:ACCOUNT_ID:key/KEY_ID"

    # Enable versioning for state file recovery
    # versioning = true
  }
}

# Workspaces for managing migration phases
# Create workspaces: terraform workspace new <workspace-name>
# - source: for us-west-1 state import
# - target: for us-west-2 deployment
# - migration: for dual-region validation

# Notes for migration:
# 1. Store us-west-1 state in: serverless-app/us-west-1/terraform.tfstate
# 2. Store us-west-2 state in: serverless-app/us-west-2/terraform.tfstate
# 3. Use separate workspaces or state keys to maintain both region states during migration
# 4. After successful cutover, retire us-west-1 state file
