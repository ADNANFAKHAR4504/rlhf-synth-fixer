#!/bin/bash
# Build script to package Lambda function for deployment

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_DIR="${SCRIPT_DIR}/../../"

echo "Building Lambda function package..."

# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TMP_DIR"

# Copy Lambda function code
cp "${SCRIPT_DIR}/payment_processor.py" "${TMP_DIR}/index.py"

# Create ZIP package
cd "${TMP_DIR}"
zip -q -r "${OUTPUT_DIR}/lambda_function.zip" .

echo "Lambda function package created: ${OUTPUT_DIR}/lambda_function.zip"

# Cleanup
rm -rf "${TMP_DIR}"

echo "Build complete!"
