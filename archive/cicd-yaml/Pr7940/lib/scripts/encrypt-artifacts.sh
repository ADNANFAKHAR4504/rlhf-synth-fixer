#!/bin/bash
set -e

# Create tarball of artifacts
tar -czf cdktf-outputs.tar.gz -C cdktf.out .

# Encrypt with AWS KMS
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdktf-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdktf-outputs.tar.gz.encrypted

echo "✅ Artifacts encrypted successfully"
