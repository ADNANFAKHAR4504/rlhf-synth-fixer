#!/bin/bash
set -e

# Encrypt CI/CD artifacts with AWS KMS for secure storage
# This script creates a tar archive of CDKTF outputs and encrypts it using KMS

echo "Creating tar archive of cdktf outputs..."
tar -czf cdktf-outputs.tar.gz -C cdktf.out .

echo "Encrypting artifacts with KMS..."
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdktf-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdktf-outputs.tar.gz.encrypted

echo "✅ Artifacts encrypted successfully"
ls -lh cdktf-outputs.tar.gz.encrypted
