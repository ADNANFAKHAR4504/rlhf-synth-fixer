#!/bin/bash

# Script to delete the failed stack and redeploy fresh
echo "🗑️  Deleting failed CloudFormation stack..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please use AWS Console method instead."
    echo "📝 Manual steps:"
    echo "   1. Go to AWS Console → CloudFormation"
    echo "   2. Find stack: SecurityMonitoringStackpr1727"
    echo "   3. Select the stack and click 'Delete'"
    echo "   4. Confirm deletion"
    echo "   5. Wait for deletion to complete"
    echo "   6. Then run: ./deploy-security-stacks.sh"
    exit 1
fi

echo "⚠️  WARNING: This will DELETE the entire SecurityMonitoringStackpr1727 stack!"
echo "📊 Stack contents that will be deleted:"
echo "   - CloudTrail resources"
echo "   - S3 buckets (with all logs)"
echo "   - CloudWatch alarms and log groups"
echo "   - VPC and networking resources"
echo ""
read -p "Are you sure you want to delete the stack? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

# Delete the stack
echo "🗑️  Deleting stack SecurityMonitoringStackpr1727..."
aws cloudformation delete-stack --stack-name SecurityMonitoringStackpr1727

if [ $? -eq 0 ]; then
    echo "✅ Stack deletion initiated!"
    echo "⏳ Waiting for deletion to complete..."
    
    # Wait for deletion to complete
    aws cloudformation wait stack-delete-complete --stack-name SecurityMonitoringStackpr1727
    
    if [ $? -eq 0 ]; then
        echo "🎉 Stack deleted successfully!"
        echo "✅ Ready to redeploy with: ./deploy-security-stacks.sh"
    else
        echo "⚠️  Deletion may still be in progress. Check AWS Console for status."
    fi
else
    echo "❌ Failed to delete stack. Please try using AWS Console."
fi
