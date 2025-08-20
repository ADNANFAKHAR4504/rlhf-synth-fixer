#!/bin/bash

# Deploy script with proper cleanup handling
set -e

ENVIRONMENT_SUFFIX=${1:-pr1728}
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

echo "🔧 Preparing to deploy stack: $STACK_NAME"

# Check if stack exists and is in failed state
echo "🔍 Checking stack status..."
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region us-east-1 --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "STACK_NOT_FOUND")

if [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ] || [ "$STACK_STATUS" = "CREATE_FAILED" ] || [ "$STACK_STATUS" = "UPDATE_ROLLBACK_COMPLETE" ]; then
    echo "⚠️  Stack is in failed state: $STACK_STATUS"
    echo "🗑️  Deleting failed stack..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME" --region us-east-1
    
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region us-east-1
    echo "✅ Stack deleted successfully"
elif [ "$STACK_STATUS" != "STACK_NOT_FOUND" ]; then
    echo "📊 Stack exists with status: $STACK_STATUS"
fi

# Deploy the stack
echo "🚀 Deploying CDK stack..."
npx cdk deploy "$STACK_NAME" --require-approval never --context environmentSuffix="$ENVIRONMENT_SUFFIX"

echo "✅ Deployment completed successfully!"
