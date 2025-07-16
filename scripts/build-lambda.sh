#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$PROJECT_ROOT/lib/lambda-functions/rds-tester"

echo "🔨 Building Lambda function package..."

# Ensure Lambda directory exists
if [[ ! -d "$LAMBDA_DIR" ]]; then
    echo "❌ Error: Lambda directory not found: $LAMBDA_DIR"
    exit 1
fi

# Navigate to Lambda directory
cd "$LAMBDA_DIR"

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf node_modules
rm -f rds-tester-lambda.zip

# Install dependencies
echo "📦 Installing production dependencies..."
npm install --production --no-optional

# Verify mysql2 was installed
if [[ ! -d "node_modules/mysql2" ]]; then
    echo "❌ Error: mysql2 dependency not found in node_modules"
    exit 1
fi

echo "✅ mysql2 dependency verified"

# Create deployment package
echo "📦 Creating deployment package..."
zip -r rds-tester-lambda.zip . -x "*.git*" "*.DS_Store*" "package-lock.json"

# Verify package was created and has reasonable size
if [[ ! -f "rds-tester-lambda.zip" ]]; then
    echo "❌ Error: Failed to create Lambda package"
    exit 1
fi

PACKAGE_SIZE=$(stat -c%s "rds-tester-lambda.zip" 2>/dev/null || stat -f%z "rds-tester-lambda.zip" 2>/dev/null || echo "0")
PACKAGE_SIZE_MB=$((PACKAGE_SIZE / 1024 / 1024))

echo "✅ Lambda package created: $LAMBDA_DIR/rds-tester-lambda.zip"
echo "📊 Package size: ${PACKAGE_SIZE_MB} MB (${PACKAGE_SIZE} bytes)"

if [[ $PACKAGE_SIZE -lt 100000 ]]; then  # Less than 100KB indicates missing dependencies
    echo "⚠️  Warning: Package size seems small - dependencies may be missing"
fi

# Upload to S3 if bucket name is provided via environment variable
if [[ -n "$LAMBDA_DEPLOYMENT_BUCKET" ]]; then
    echo "📤 Uploading Lambda package to S3..."
    aws s3 cp rds-tester-lambda.zip "s3://$LAMBDA_DEPLOYMENT_BUCKET/rds-tester-lambda.zip"
    echo "✅ Lambda package uploaded to S3: s3://$LAMBDA_DEPLOYMENT_BUCKET/rds-tester-lambda.zip"
else
    echo "💡 To upload to S3, set LAMBDA_DEPLOYMENT_BUCKET environment variable"
fi

ls -la rds-tester-lambda.zip