#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LAMBDA_DIR="$PROJECT_ROOT/lib/lambda"

echo "Packaging Lambda functions..."

# Package payment_processor Lambda
echo "Packaging payment_processor Lambda..."
cd "$LAMBDA_DIR/payment_processor"
zip -r "$LAMBDA_DIR/payment_processor.zip" index.py
echo "✓ payment_processor.zip created"

# Package health_check Lambda
echo "Packaging health_check Lambda..."
cd "$LAMBDA_DIR/health_check"
zip -r "$LAMBDA_DIR/health_check.zip" index.py
echo "✓ health_check.zip created"

echo "All Lambda functions packaged successfully!"
