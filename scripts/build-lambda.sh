#!/bin/bash
# Script to build and package Lambda functions

set -e

echo "Building health-check Lambda function..."

# Create lambda directory if it doesn't exist
mkdir -p lambda/health-check

# Change to lambda directory
cd lambda/health-check

# Install dependencies (if package.json exists)
if [ -f "package.json" ]; then
    echo "Installing Lambda dependencies..."
    npm install --production
fi

# Create the deployment package
echo "Creating deployment package..."
zip -r ../../health-check-lambda.zip . -x "*.git*" "node_modules/.cache/*" "*.DS_Store*"

echo "Lambda package created: health-check-lambda.zip"

# Go back to root directory
cd ../..

echo "Lambda function packaging completed successfully!"