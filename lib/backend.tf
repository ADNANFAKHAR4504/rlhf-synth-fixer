terraform {
  # Using local backend for QA testing
  # In production, use S3 backend with appropriate bucket in target region
  backend "local" {
    path = "terraform.tfstate"
  }
}