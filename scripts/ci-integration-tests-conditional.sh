#!/bin/bash

# Conditional Integration Tests Script
# Runs integration tests against LocalStack or AWS based on provider metadata

set -e

PROVIDER="${PROVIDER:-}"

if [ "$PROVIDER" == "localstack" ]; then
  echo "Deploying to LocalStack and running integration tests..."

  # Save real AWS credentials for Pulumi S3 backend access
  # These will be used by tests to read Pulumi state from S3
  export REAL_AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
  export REAL_AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"

  export AWS_ENDPOINT_URL=http://localhost:4566
  # Use s3.localhost.localstack.cloud for S3 endpoint to ensure proper bucket name parsing
  export AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566
  export AWS_ACCESS_KEY_ID=test
  export AWS_SECRET_ACCESS_KEY=test
  export AWS_DEFAULT_REGION=us-east-1
  export AWS_REGION=us-east-1
  export LOCALSTACK_API_KEY="${LOCALSTACK_API_KEY:-}"
  # Force S3 path-style addressing for LocalStack
  export AWS_S3_FORCE_PATH_STYLE=true
  export AWS_S3_USE_PATH_STYLE=1
  ./scripts/localstack-ci-deploy.sh && ./scripts/localstack-ci-test.sh
else
  echo "Running integration tests against AWS..."
  ./scripts/integration-tests.sh
fi
