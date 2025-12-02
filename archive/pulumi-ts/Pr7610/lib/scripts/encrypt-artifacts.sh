#!/bin/bash
set -e

# Encrypt CDK artifacts with KMS
tar -czf cdk-outputs.tar.gz -C cdk.out .
aws kms encrypt \
  --key-id alias/github-actions-artifacts \
  --plaintext fileb://cdk-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdk-outputs.tar.gz.encrypted
