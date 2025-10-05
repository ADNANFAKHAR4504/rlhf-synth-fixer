#!/bin/bash

# CloudFormation Stack Cleanup Script
# Deletes conflicting stacks and waits for completion

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}

echo "🧹 Cleaning up conflicting CloudFormation stacks..."
echo "Region: $AWS_REGION"
echo "Environment Suffix: $ENVIRONMENT_SUFFIX"

# Function to check if stack exists
check_stack_exists() {
    local stack_name=$1
    aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" > /dev/null 2>&1
}

# Function to delete stack and wait for completion
delete_stack_and_wait() {
    local stack_name=$1
    echo "🗑️ Deleting stack: $stack_name"
    aws cloudformation delete-stack --stack-name "$stack_name" --region "$AWS_REGION"
    echo "⏳ Waiting for stack deletion to complete: $stack_name"
    echo "   This may take several minutes..."
    aws cloudformation wait stack-delete-complete --stack-name "$stack_name" --region "$AWS_REGION"
    echo "✅ Stack deleted successfully: $stack_name"
}

# Clean up TapStackpr3403 (the problematic stack)
if check_stack_exists "TapStackpr3403"; then
    echo "📋 Found problematic stack: TapStackpr3403"
    delete_stack_and_wait "TapStackpr3403"
else
    echo "ℹ️ Stack TapStackpr3403 not found (already deleted or never existed)"
fi

# Clean up environment-specific stack
ENV_STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
if check_stack_exists "$ENV_STACK_NAME"; then
    echo "📋 Found environment stack: $ENV_STACK_NAME"
    delete_stack_and_wait "$ENV_STACK_NAME"
else
    echo "ℹ️ Stack $ENV_STACK_NAME not found (already deleted or never existed)"
fi

echo "🎉 CloudFormation cleanup completed successfully!"
echo "✨ Ready for clean deployment"
