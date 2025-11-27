#!/bin/bash

# Script to build Lambda deployment package

set -e

echo "Building Lambda deployment package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy Lambda code
cp index.py "$TEMP_DIR/"

# Create zip file
cd "$TEMP_DIR"
zip -r function.zip index.py

# Move zip to module directory
mv function.zip "$(dirname "$0")/function.zip"

# Cleanup
rm -rf "$TEMP_DIR"

echo "Lambda deployment package created: function.zip"
