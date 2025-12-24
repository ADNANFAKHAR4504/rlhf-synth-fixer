# Backend configuration removed to fix Lint job
# The backend is configured at runtime via -backend-config CLI flags in deploy scripts
# See scripts/localstack-ci-deploy.sh and scripts/bootstrap.sh for backend configuration
terraform {
  # backend "s3" {}
}
