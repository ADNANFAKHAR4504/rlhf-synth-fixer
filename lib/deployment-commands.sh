#!/bin/bash

# AWS Nova Model Breaking - CloudFormation Deployment Script
# This script contains the commands needed to deploy and manage the CloudFormation stack
# Note: Run these commands manually since AWS CLI is not available in this environment

echo "🚀 AWS Nova Model Breaking - CloudFormation Management Commands"
echo "=============================================================="

# Set environment variables
export STACK_NAME="TapStackdev"
export REGION="us-west-2"
export TEMPLATE_FILE="lib/TapStack.yml"
export ENVIRONMENT_SUFFIX="dev"

echo ""
echo "📋 Deployment Commands:"
echo "----------------------"

echo "1. Validate the CloudFormation template:"
echo "   aws cloudformation validate-template --template-body file://$TEMPLATE_FILE --region $REGION"

echo ""
echo "2. Deploy the CloudFormation stack:"
echo "   aws cloudformation deploy \\"
echo "     --template-file $TEMPLATE_FILE \\"
echo "     --stack-name $STACK_NAME \\"
echo "     --capabilities CAPABILITY_NAMED_IAM \\"
echo "     --parameter-overrides EnvironmentSuffix=$ENVIRONMENT_SUFFIX \\"
echo "     --region $REGION"

echo ""
echo "3. Get stack outputs:"
echo "   aws cloudformation describe-stacks \\"
echo "     --stack-name $STACK_NAME \\"
echo "     --region $REGION \\"
echo "     --query 'Stacks[0].Outputs' \\"
echo "     --output json > cfn-outputs/stack-outputs.json"

echo ""
echo "4. Create flat outputs file for integration tests:"
echo "   aws cloudformation describe-stacks \\"
echo "     --stack-name $STACK_NAME \\"
echo "     --region $REGION \\"
echo "     --query 'Stacks[0].Outputs[*].{OutputKey:OutputKey,OutputValue:OutputValue}' \\"
echo "     --output json | jq -r '.[] | \"\\(.OutputKey): \\(.OutputValue)\"' > cfn-outputs/flat-outputs.json"

echo ""
echo "📊 Testing Commands:"
echo "-------------------"

echo "5. Run all tests after deployment:"
echo "   node test/security-tests.js"
echo "   node test/tap-stack.standalone.test.js"
echo "   node test/tap-stack.integration.test.js"

echo ""
echo "🗑️ Cleanup Commands:"
echo "--------------------"

echo "6. Empty S3 buckets before stack deletion:"
echo "   # Get bucket names from stack outputs first"
echo "   MAIN_BUCKET=\$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==\`MainS3BucketName\`].OutputValue' --output text)"
echo "   LOGS_BUCKET=\$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==\`S3AccessLogsBucketName\`].OutputValue' --output text)"
echo ""
echo "   # Empty the buckets"
echo "   aws s3 rm s3://\$MAIN_BUCKET --recursive --region $REGION"
echo "   aws s3 rm s3://\$LOGS_BUCKET --recursive --region $REGION"

echo ""
echo "7. Delete the CloudFormation stack:"
echo "   aws cloudformation delete-stack \\"
echo "     --stack-name $STACK_NAME \\"
echo "     --region $REGION"

echo ""
echo "8. Wait for stack deletion to complete:"
echo "   aws cloudformation wait stack-delete-complete \\"
echo "     --stack-name $STACK_NAME \\"
echo "     --region $REGION"

echo ""
echo "✅ Commands are ready for execution!"
echo "   Note: Execute these commands manually in an environment with AWS CLI configured"
