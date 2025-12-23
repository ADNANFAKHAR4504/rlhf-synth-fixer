#!/bin/bash
# Script to package Lambda functions into zip files for deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Packaging Lambda functions..."

# Package API Handler
echo "Packaging api_handler..."
cp api_handler.py index.py
zip -q api_handler.zip index.py
rm index.py
echo "Created api_handler.zip"

# Package Fraud Detection
echo "Packaging fraud_detection..."
cp fraud_detection.py index.py
zip -q fraud_detection.zip index.py
rm index.py
echo "Created fraud_detection.zip"

# Package Notification Handler
echo "Packaging notification_handler..."
cp notification_handler.py index.py
zip -q notification_handler.zip index.py
rm index.py
echo "Created notification_handler.zip"

echo "All Lambda functions packaged successfully!"
