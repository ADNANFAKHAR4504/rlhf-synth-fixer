# Backend Configuration
# Note: For initial deployment, using local backend since we're creating the S3 bucket and DynamoDB table
# For subsequent deployments, uncomment the s3 backend block below and run:
# terraform init -migrate-state

# terraform {
#   backend "s3" {
#     # Use -backend-config for these values or environment variables
#     # Example: terraform init -backend-config="bucket=my-state-bucket"
#     key     = "infrastructure/terraform.tfstate"
#     region  = "us-east-1"
#     encrypt = true
#   }
# }

# Instructions for backend configuration:
# 1. First run: Deploy with local backend (creates S3 bucket and DynamoDB table)
# 2. Uncomment the backend block above
# 3. Create a backend.hcl file with:
#    bucket         = "multi-env-terraform-state-${var.environment_suffix}"
#    dynamodb_table = "multi-env-terraform-locks-${var.environment_suffix}"
# 4. Run: terraform init -backend-config=backend.hcl -migrate-state
