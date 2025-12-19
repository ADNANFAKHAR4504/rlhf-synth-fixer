#!/bin/bash
set -e

echo "🔐 Encrypting artifacts with KMS..."

# Create tarball of artifacts
tar -czf cdk-outputs.tar.gz -C cdk.out .

# Encrypt with AWS KMS
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdk-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdk-outputs.tar.gz.encrypted

echo "✅ Artifacts encrypted successfully"
