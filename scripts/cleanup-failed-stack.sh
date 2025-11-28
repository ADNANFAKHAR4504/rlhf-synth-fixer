#!/bin/bash

# Cleanup script for failed CloudFormation stacks
# This script deletes stacks in ROLLBACK_FAILED state which cannot be updated

set -e

STACK_NAME="${1:-TapStackpr7459}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🧹 Cleaning up failed stack: $STACK_NAME"
echo "Region: $AWS_REGION"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query 'Stacks[0].StackStatus' --output text)
    echo "Current stack status: $STACK_STATUS"

    if [[ "$STACK_STATUS" == "ROLLBACK_FAILED" ]] || [[ "$STACK_STATUS" == "CREATE_FAILED" ]] || [[ "$STACK_STATUS" == "DELETE_FAILED" ]]; then
        echo "⚠️  Stack is in failed state, deleting..."
        aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"
        echo "✅ Delete initiated. Waiting for stack deletion..."
        aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" || true
        echo "✅ Stack deleted successfully"
    else
        echo "ℹ️  Stack is not in a failed state. Current status: $STACK_STATUS"
        echo "⚠️  If you want to delete this stack, use: aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION"
    fi
else
    echo "ℹ️  Stack $STACK_NAME does not exist or is already deleted"
fi

echo "✅ Cleanup completed"
