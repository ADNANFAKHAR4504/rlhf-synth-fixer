#!/bin/bash

# Upload archive folder to S3
# Uploads the PR archive folder to S3 with validation

set -e

PLATFORM="${PLATFORM:-}"
LANGUAGE="${LANGUAGE:-}"
PR_NUMBER="${PR_NUMBER:-}"
S3_RELEASE_BUCKET_NAME="${S3_RELEASE_BUCKET_NAME:-}"

S3_PREFIX="${PLATFORM}-${LANGUAGE}/Pr${PR_NUMBER}"

echo "Uploading archive folder to S3 bucket: $S3_RELEASE_BUCKET_NAME"
echo "S3 prefix: $S3_PREFIX"

# Check if archive folder exists
if [ -d "archive/${S3_PREFIX}" ]; then
  # Upload the archive folder contents to S3, preserving folder structure
  aws s3 sync "archive/${S3_PREFIX}/" "s3://$S3_RELEASE_BUCKET_NAME/${S3_PREFIX}/" \
    --delete \
    --exclude "*.git*" \
    --exclude "node_modules/*"
  echo "Successfully uploaded archive to S3"
else
  echo "Archive folder archive/${S3_PREFIX} not found, nothing to upload"
  exit 1
fi
