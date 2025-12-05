#!/bin/bash
# Build script to package Lambda functions for deployment

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Building Lambda function packages..."

# Build upload handler
echo "  - Building lambda_upload.zip..."
cd "${SCRIPT_DIR}"
zip -q lambda_upload.zip lambda_upload.py
echo "    ✓ lambda_upload.zip created"

# Build process handler
echo "  - Building lambda_process.zip..."
zip -q lambda_process.zip lambda_process.py
echo "    ✓ lambda_process.zip created"

# Build status handler
echo "  - Building lambda_status.zip..."
zip -q lambda_status.zip lambda_status.py
echo "    ✓ lambda_status.zip created"

echo "✓ All Lambda function packages built successfully!"
