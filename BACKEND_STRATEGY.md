# Backend Configuration for Different Environments

## Manual Testing Backend (Local)
# For manual testing, keep local state
# File: backend-local.tf (for manual testing)

terraform {
  # No backend - uses local state
}

## Pipeline Backend (Remote S3)
# For pipeline deployment, use remote backend
# File: backend-remote.tf (for CI/CD pipeline)

terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "environments/${var.environment}/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

## Environment-Specific State Keys
# dev environment: environments/dev/terraform.tfstate
# test environment: environments/test/terraform.tfstate
# prod environment: environments/prod/terraform.tfstate
