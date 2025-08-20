#!/bin/bash

echo "🚀 Deploying SecurityMonitoringStack after rollback fix..."
echo "⚠️  Make sure you've completed the rollback in AWS Console first!"
echo ""

# Build first
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy the monitoring stack with CloudTrail V2 fix
echo "🔍 Deploying SecurityMonitoringStack with CloudTrail fix..."
npx cdk deploy SecurityMonitoringStackpr1727 --require-approval never

if [ $? -eq 0 ]; then
    echo "✅ SecurityMonitoringStack deployed successfully!"
    echo "🎉 CloudTrail issue is now resolved!"
else
    echo "❌ Deployment failed. Check the error output above."
    exit 1
fi
