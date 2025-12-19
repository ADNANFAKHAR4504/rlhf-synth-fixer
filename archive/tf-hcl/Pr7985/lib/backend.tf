# Backend configuration for Terraform state
# Using S3 backend for CI/CD pipeline state management
# Backend configuration values are passed via -backend-config during terraform init

terraform {
  backend "s3" {
    # Configuration provided via -backend-config flags:
    # bucket  = "iac-rlhf-tf-states-xxx"
    # key     = "prs/prXXXX/terraform.tfstate"
    # region  = "us-east-1"
    # encrypt = true
  }
}
