terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration - commented out for initial setup
  # Uncomment after creating backend resources (S3 bucket and DynamoDB table)
  # backend "s3" {
  #   bucket         = "terraform-state-migration"
  #   key            = "legacy-migration/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  #
  #   workspace_key_prefix = "workspaces"
  # }
}
