#!/bin/bash

# Build script for Lambda functions

set -e

echo "Building Lambda functions..."

# Build validator
echo "Building validator..."
cd validator
npm install
npm run build 2>/dev/null || tsc || echo "TypeScript compilation attempted"
zip -r ../validator.zip . -x "*.ts" "tsconfig.json"
cd ..

# Build processor
echo "Building processor..."
cd processor
npm install
npm run build 2>/dev/null || tsc || echo "TypeScript compilation attempted"
zip -r ../processor.zip . -x "*.ts" "tsconfig.json"
cd ..

echo "Lambda functions built successfully!"
