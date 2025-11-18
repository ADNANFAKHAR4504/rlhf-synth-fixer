terraform {
  # S3 backend configuration for remote state storage
  # The backend configuration values will be provided via -backend-config flags during initialization
  backend "s3" {
    # bucket, key, region, and encrypt will be provided via -backend-config flags
    # This allows for environment-specific state files without hardcoding values
  }
}