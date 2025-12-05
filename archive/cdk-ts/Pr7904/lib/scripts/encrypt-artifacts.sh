#!/bin/bash
# Encrypt CDK artifacts with AWS KMS
set -e

# Create tarball of artifacts
tar -czf cdk-outputs.tar.gz -C cdk.out .

# Encrypt with AWS KMS
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdk-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdk-outputs.tar.gz.encrypted
