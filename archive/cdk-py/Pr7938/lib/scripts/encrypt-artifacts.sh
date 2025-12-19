#!/bin/bash
# Encrypt CDK output artifacts with AWS KMS
set -e

echo "Creating tarball of CDK artifacts..."
tar -czf cdk-outputs.tar.gz -C cdk.out .

echo "Encrypting with AWS KMS..."
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdk-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdk-outputs.tar.gz.encrypted

echo "Artifact encryption complete"
