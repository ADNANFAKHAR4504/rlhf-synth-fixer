#!/bin/bash
# Encrypt CDK artifacts with AWS KMS
# This script creates a tarball of CDK outputs and encrypts it using AWS KMS

set -e

echo "Creating tarball of artifacts..."
tar -czf cdk-outputs.tar.gz -C cdk.out .

echo "Encrypting with AWS KMS..."
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdk-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdk-outputs.tar.gz.encrypted

echo "Artifact encryption completed successfully"
