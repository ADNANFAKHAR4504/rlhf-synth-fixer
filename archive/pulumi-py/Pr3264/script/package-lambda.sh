#!/bin/bash

# Package Lambda function with dependencies
set -e

echo "📦 Packaging Lambda function with dependencies..."

# Create temporary directory for packaging
PACKAGE_DIR=$(mktemp -d)
echo "Using temporary directory: $PACKAGE_DIR"

# Copy Lambda code
cp lib/lambda/index.py "$PACKAGE_DIR/"

# Install dependencies
echo "Installing dependencies..."
pip install -r lib/lambda/requirements.txt -t "$PACKAGE_DIR" --quiet

# Create zip file
echo "Creating deployment package..."
cd "$PACKAGE_DIR"
zip -r lambda-package.zip . -q
cd -

# Create output directory
mkdir -p lib/lambda-package

# Move package to output directory
mv "$PACKAGE_DIR/lambda-package.zip" lib/lambda-package/

# Clean up
rm -rf "$PACKAGE_DIR"

echo "✅ Lambda package created at lib/lambda-package/lambda-package.zip"
