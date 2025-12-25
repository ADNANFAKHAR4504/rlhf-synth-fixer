locals {
  # LocalStack detection - checks if AWS_ENDPOINT_URL environment variable contains
  # localhost or localstack patterns (set by CI/CD when provider=localstack)
  # Can also be explicitly set via var.is_localstack=true
  is_localstack = var.is_localstack
}
