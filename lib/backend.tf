# backend.tf
# S3 backend for state management (configured dynamically by bootstrap script)
terraform {
  backend "s3" {
    # These values are configured via -backend-config flags during terraform init
    # bucket = "configured-via-backend-config"
    # key    = "configured-via-backend-config"
    # region = "configured-via-backend-config"
    # encrypt = true
  }
}

# Local backend for local testing (not used in CI/CD)
# terraform {
#   backend "local" {
#     path = "terraform.tfstate"
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
