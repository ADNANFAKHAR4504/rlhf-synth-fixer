# backend.tf
# Local backend for testing (not recommended for production)
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}

# S3 backend for production (requires pre-created resources)
# terraform {
#   backend "s3" {
#     bucket         = "PLACEHOLDER-terraform-state-bucket"
#     key            = "myapp/us-west-2/terraform.tfstate"
#     region         = "us-west-2"
#     encrypt        = true
#     dynamodb_table = "PLACEHOLDER-terraform-locks"
#
#     # Optional: Use assume role for cross-account access
#     # role_arn = "arn:aws:iam::ACCOUNT-ID:role/TerraformRole"
#   }
# }

# Alternative backend configuration for remote state management
# terraform {
#   backend "remote" {
#     hostname     = "app.terraform.io"
#     organization = "PLACEHOLDER-ORG-NAME"
#
#     workspaces {
#       name = "myapp-us-west-2"
#     }
#   }
# }
