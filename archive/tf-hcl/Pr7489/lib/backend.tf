terraform {
  backend "s3" {
    # Backend configuration will be provided via environment variables:
    # - bucket: TERRAFORM_STATE_BUCKET
    # - region: TERRAFORM_STATE_BUCKET_REGION
    # - key: TERRAFORM_STATE_BUCKET_KEY
    # These are set by the CI/CD pipeline or deployment scripts
    encrypt = true
  }
}
