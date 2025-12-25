terraform {
  backend "s3" {
    # S3 backend configuration for LocalStack compatibility
    # These values are overridden at terraform init time by CI/CD
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    force_path_style            = true
  }
}
