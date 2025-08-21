# backend.tf - S3 backend configuration with workspace prefix support

terraform {
  # S3 backend configuration with workspace prefix support
  backend "s3" {
    # These values will be provided via command line arguments or environment variables
    # bucket         = "your-terraform-state-bucket"
    # key            = "workspace-prefix/terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "terraform-state-lock"
    # encrypt        = true

    # Key structure supports workspace prefixes:
    # - staging:     "staging/terraform.tfstate"
    # - production:  "production/terraform.tfstate"
    # - default:     "staging/terraform.tfstate" (fallback)
  }
}

# Alternative: Terraform Cloud backend (uncomment if using Terraform Cloud)
# terraform {
#   cloud {
#     organization = "TuringGpt"
#     workspaces {
#       name = "iac-test-automations-${terraform.workspace}"
#     }
#   }
# }
