#!/bin/bash

# Script to delete the failed SecurityMonitoringStackpr1727
echo "🗑️  Deleting SecurityMonitoringStackpr1727..."

echo "📝 Manual steps for AWS Console:"
echo "   1. Go to AWS Console → CloudFormation"
echo "   2. Find stack: SecurityMonitoringStackpr1727" 
echo "   3. Select the stack"
echo "   4. Click 'Delete'"
echo "   5. If deletion fails, you may need to:"
echo "      - Skip deletion of failed resources"
echo "      - Or manually delete some resources first"
echo ""
echo "🔧 Common resources that might block deletion:"
echo "   - CloudTrail: SecurityCloudTrailpr1727EC826115"
echo "   - S3 Bucket: CloudTrailBucket (may need to empty first)"
echo "   - Log Groups: Check CloudWatch Logs"
echo ""
echo "⚠️  After successful deletion, you can redeploy with:"
echo "   npx cdk deploy SecurityMonitoringStackpr1727"
