#!/bin/bash
set -euo pipefail

BUILD_DIR=$1
STORAGE_ACCOUNT="saretailfrontend"
CONTAINER="\$web"

echo "Uploading frontend to Azure Storage..."

# Enable static website hosting
az storage blob service-properties update \
    --account-name "$STORAGE_ACCOUNT" \
    --static-website \
    --index-document index.html \
    --404-document 404.html

# Upload build artifacts
az storage blob upload-batch \
    --account-name "$STORAGE_ACCOUNT" \
    --source "$BUILD_DIR/build" \
    --destination "$CONTAINER" \
    --overwrite

# Set cache control headers
az storage blob update-batch \
    --account-name "$STORAGE_ACCOUNT" \
    --source "$CONTAINER" \
    --pattern "*.js" \
    --content-cache-control "public, max-age=31536000"

echo "Frontend uploaded successfully"