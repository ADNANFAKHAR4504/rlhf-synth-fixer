#!/bin/bash
# Extract CDKTF outputs to JSON file
# This script properly handles multi-line array outputs

set -e

OUTPUT_DIR="${1:-cdk-outputs}"
OUTPUT_FILE="${OUTPUT_DIR}/flat-outputs.json"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Use cdktf output to get JSON directly
echo "Extracting CDKTF outputs..."
cdktf output --outputs-file "$OUTPUT_FILE" TapStackpr9594

echo "✅ Saved outputs to $OUTPUT_FILE"

# Verify the output file has all expected keys
EXPECTED_OUTPUTS=(
  "vpc_id"
  "vpc_cidr_block"
  "public_subnet_ids"
  "private_subnet_ids"
  "web_security_group_id"
  "ssh_security_group_id"
  "ec2_role_arn"
  "ec2_role_name"
  "cloudtrail_role_arn"
  "app_data_bucket_name"
  "app_data_bucket_arn"
  "cloudtrail_bucket_name"
  "access_logs_bucket_name"
  "cloudtrail_arn"
  "database_secret_arn"
  "api_keys_secret_arn"
  "kms_key_ids"
)

MISSING=0
for key in "${EXPECTED_OUTPUTS[@]}"; do
  if ! jq -e ".$key" "$OUTPUT_FILE" > /dev/null 2>&1; then
    echo "⚠️  Missing output: $key"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "✅ All ${#EXPECTED_OUTPUTS[@]} expected outputs present"
else
  echo "❌ $MISSING outputs missing"
  exit 1
fi
