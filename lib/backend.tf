# Backend configuration for Terraform state
# Using local backend for testing and validation
# In production, this would be configured to use S3 with DynamoDB locking

terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
