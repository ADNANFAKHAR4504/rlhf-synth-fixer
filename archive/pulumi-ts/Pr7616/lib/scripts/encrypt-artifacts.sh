#!/bin/bash
# Script to package and encrypt artifacts with AWS KMS

set -e

# Package the application
tar -czf pulumi-app.tar.gz lib/ bin/ package.json tsconfig.json

# Encrypt with AWS KMS
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://pulumi-app.tar.gz \
  --output text \
  --query CiphertextBlob > pulumi-app.tar.gz.encrypted

echo "Artifacts successfully encrypted with AWS KMS"
