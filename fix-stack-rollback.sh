#!/bin/bash

# Script to continue rollback for the failed stack
echo "🔄 Attempting to continue rollback for failed CloudFormation stack..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please use AWS Console method instead."
    echo ""
    echo "📝 Manual steps to continue rollback:"
    echo "   1. Go to AWS Console → CloudFormation"
    echo "   2. Find stack: SecurityMonitoringStackpr1727"
    echo "   3. Select the stack"
    echo "   4. Click 'Stack actions' → 'Continue update rollback'"
    echo "   5. Skip these failed resources:"
    echo "      ✓ SecurityCloudTrailpr1727EC826115"
    echo "      ✓ CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F"
    echo "   6. Click 'Continue update rollback'"
    echo "   7. Wait for rollback to complete"
    echo "   8. Then run: ./deploy-security-stacks.sh"
    echo ""
    echo "🌐 Direct link: https://console.aws.amazon.com/cloudformation"
    exit 1
fi

echo "🔄 Continuing rollback for SecurityMonitoringStackpr1727..."
echo "📋 Skipping failed resources:"
echo "   - SecurityCloudTrailpr1727EC826115"
echo "   - CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F"

# Continue rollback with skipped resources
aws cloudformation continue-update-rollback \
    --stack-name SecurityMonitoringStackpr1727 \
    --resources-to-skip SecurityCloudTrailpr1727EC826115 \
    --resources-to-skip CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F

if [ $? -eq 0 ]; then
    echo "✅ Rollback continuation initiated!"
    echo "⏳ Waiting for rollback to complete..."
    
    # Wait for rollback to complete
    aws cloudformation wait stack-update-complete --stack-name SecurityMonitoringStackpr1727
    
    if [ $? -eq 0 ]; then
        echo "🎉 Rollback completed successfully!"
        echo "✅ Stack is now ready for updates. Run: ./deploy-security-stacks.sh"
    else
        echo "⚠️  Rollback may still be in progress. Check AWS Console for status."
    fi
else
    echo "❌ Failed to continue rollback. You may need to delete the stack instead."
    echo "💡 Try running: ./delete-failed-stack.sh"
fi
