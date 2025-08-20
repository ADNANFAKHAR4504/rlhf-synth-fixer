#!/bin/bash

# Script to continue rollback for failed CloudFormation stack
echo "🔄 Continuing rollback for SecurityMonitoringStackpr1727..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please use AWS Console method instead."
    echo "📝 Manual steps:"
    echo "   1. Go to AWS Console → CloudFormation"
    echo "   2. Find stack: SecurityMonitoringStackpr1727"
    echo "   3. Click 'Stack actions' → 'Continue update rollback'"
    echo "   4. Skip these resources:"
    echo "      - SecurityCloudTrailpr1727EC826115"
    echo "      - CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F"
    exit 1
fi

# Continue rollback, skipping the failed resources
aws cloudformation continue-update-rollback \
    --stack-name SecurityMonitoringStackpr1727 \
    --resources-to-skip SecurityCloudTrailpr1727EC826115 \
    --resources-to-skip CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F

if [ $? -eq 0 ]; then
    echo "✅ Rollback continuation initiated successfully!"
    echo "⏳ Waiting for rollback to complete..."
    
    # Wait for the rollback to complete
    aws cloudformation wait stack-update-complete --stack-name SecurityMonitoringStackpr1727
    
    if [ $? -eq 0 ]; then
        echo "🎉 Stack rollback completed successfully!"
        echo "✅ Stack is now ready for redeployment"
    else
        echo "⚠️  Rollback may still be in progress. Check AWS Console for status."
    fi
else
    echo "❌ Failed to continue rollback. Please try using AWS Console."
fi
