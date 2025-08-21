# backend.tf - Terraform Cloud backend configuration with workspace support

terraform {
  # Primary: Terraform Cloud backend with workspace prefix support
  cloud {
    organization = "TuringGpt"
    workspaces {
      name = "iac-test-automations-${terraform.workspace}"
    }
  }
}

# Alternative: S3 backend with workspace prefix support (for local development)
# terraform {
#   backend "s3" {
#     # These values will be provided via command line arguments or environment variables
#     # bucket         = "your-terraform-state-bucket"
#     # key            = "workspace-prefix/terraform.tfstate"
#     # region         = "us-east-1"
#     # dynamodb_table = "terraform-state-lock"
#     # encrypt        = true
#     
#     # Key structure supports workspace prefixes:
#     # - staging:     "staging/terraform.tfstate"
#     # - production:  "production/terraform.tfstate"
#     # - default:     "staging/terraform.tfstate" (fallback)
#   }
# }
