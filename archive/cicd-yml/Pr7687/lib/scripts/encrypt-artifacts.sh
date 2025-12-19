#!/bin/bash
set -euo pipefail

KMS_KEY_ID="$1"

tar -czf cdk-outputs.tar.gz -C cdk.out .
aws kms encrypt \
  --key-id "${KMS_KEY_ID}" \
  --plaintext fileb://cdk-outputs.tar.gz \
  --output text \
  --query CiphertextBlob > cdk-outputs.tar.gz.encrypted

