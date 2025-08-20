#!/bin/bash

# Deployment script for security stacks after fixing UPDATE_ROLLBACK_FAILED
echo "🚀 Deploying Security Infrastructure Stacks..."

# Build the project first
echo "📦 Building CDK project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy stacks in dependency order
echo "🔑 Deploying KMS Stack..."
npx cdk deploy SecurityKmsStackdev --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ KMS Stack deployment failed."
    exit 1
fi

echo "👤 Deploying IAM Stack..."
npx cdk deploy SecurityIamStackdev --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ IAM Stack deployment failed."
    exit 1
fi

echo "📊 Deploying Config Stack..."
npx cdk deploy SecurityConfigStackdev --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ Config Stack deployment failed."
    exit 1
fi

echo "🔍 Deploying Monitoring Stack (with CloudTrail fix)..."
npx cdk deploy SecurityMonitoringStackdev --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ Monitoring Stack deployment failed."
    exit 1
fi

echo "✅ All security stacks deployed successfully!"
echo "🎉 Security infrastructure is ready!"
