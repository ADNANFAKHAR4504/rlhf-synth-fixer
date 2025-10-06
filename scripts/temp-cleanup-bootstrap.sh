#!/bin/bash

# Temporary cleanup script for CDK bootstrap conflicts
# This script removes existing CDK bootstrap resources to allow fresh deployment
# WARNING: This is a temporary script - remove before pushing to CI/CD

set -e

echo "🧹 Starting temporary CDK bootstrap cleanup..."
echo "⚠️  WARNING: This is a temporary cleanup script for local testing only"
echo "📍 Target region: us-west-2"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "UNKNOWN")
echo "🔍 AWS Account ID: $ACCOUNT_ID"

# Function to safely delete CloudFormation stack
delete_stack_if_exists() {
    local stack_name=$1
    echo "🔍 Checking if stack '$stack_name' exists..."
    
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region us-west-2 >/dev/null 2>&1; then
        echo "🗑️  Deleting existing stack: $stack_name"
        aws cloudformation delete-stack --stack-name "$stack_name" --region us-west-2
        
        echo "⏳ Waiting for stack deletion to complete..."
        aws cloudformation wait stack-delete-complete --stack-name "$stack_name" --region us-west-2
        echo "✅ Stack '$stack_name' deleted successfully"
    else
        echo "ℹ️  Stack '$stack_name' does not exist, skipping..."
    fi
}

# Function to detach and delete IAM policies
cleanup_iam_policies() {
    local role_name=$1
    echo "🔍 Cleaning up policies for role: $role_name"
    
    if aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
        echo "📋 Detaching policies from role: $role_name"
        
        # List and detach all attached policies
        aws iam list-attached-role-policies --role-name "$role_name" --query 'AttachedPolicies[].PolicyArn' --output text | while read -r policy_arn; do
            if [ -n "$policy_arn" ] && [ "$policy_arn" != "None" ]; then
                echo "  🔗 Detaching policy: $policy_arn"
                aws iam detach-role-policy --role-name "$role_name" --policy-arn "$policy_arn" || true
            fi
        done
        
        # List and delete inline policies
        aws iam list-role-policies --role-name "$role_name" --query 'PolicyNames' --output text | while read -r policy_name; do
            if [ -n "$policy_name" ] && [ "$policy_name" != "None" ]; then
                echo "  📝 Deleting inline policy: $policy_name"
                aws iam delete-role-policy --role-name "$role_name" --policy-name "$policy_name" || true
            fi
        done
        
        echo "🗑️  Deleting IAM role: $role_name"
        aws iam delete-role --role-name "$role_name" || true
        echo "✅ IAM role '$role_name' cleanup completed"
    else
        echo "ℹ️  IAM role '$role_name' does not exist, skipping..."
    fi
}

# Main cleanup process
echo ""
echo "🚀 Starting cleanup process..."

# Delete CDKToolkit CloudFormation stack
delete_stack_if_exists "CDKToolkit"

# Cleanup specific IAM roles that are causing conflicts
if [ "$ACCOUNT_ID" != "UNKNOWN" ]; then
    echo ""
    echo "🔧 Cleaning up CDK IAM roles..."
    
    cleanup_iam_policies "cdk-hnb659fds-lookup-role-${ACCOUNT_ID}-us-west-2"
    cleanup_iam_policies "cdk-hnb659fds-image-publishing-role-${ACCOUNT_ID}-us-west-2"
    cleanup_iam_policies "cdk-hnb659fds-file-publishing-role-${ACCOUNT_ID}-us-west-2"
    cleanup_iam_policies "cdk-hnb659fds-deploy-role-${ACCOUNT_ID}-us-west-2"
    cleanup_iam_policies "cdk-hnb659fds-cfn-exec-role-${ACCOUNT_ID}-us-west-2"
else
    echo "⚠️  Could not determine AWS Account ID, skipping IAM role cleanup"
fi

# Clean up S3 bucket if it exists
echo ""
echo "🪣 Checking for CDK bootstrap S3 bucket..."
if [ "$ACCOUNT_ID" != "UNKNOWN" ]; then
    BUCKET_NAME="cdk-hnb659fds-assets-${ACCOUNT_ID}-us-west-2"
    
    if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        echo "🗑️  Emptying and deleting S3 bucket: $BUCKET_NAME"
        aws s3 rm "s3://$BUCKET_NAME" --recursive || true
        aws s3api delete-bucket --bucket "$BUCKET_NAME" --region us-west-2 || true
        echo "✅ S3 bucket cleanup completed"
    else
        echo "ℹ️  S3 bucket '$BUCKET_NAME' does not exist, skipping..."
    fi
fi

echo ""
echo "🎉 TEMPORARY CLEANUP COMPLETED SUCCESSFULLY!"
echo "📝 Summary of actions taken:"
echo "   ✅ Deleted CDKToolkit CloudFormation stack (if existed)"
echo "   ✅ Cleaned up CDK IAM roles and policies (if existed)"
echo "   ✅ Cleaned up CDK S3 bootstrap bucket (if existed)"
echo ""
echo "🚀 Ready for fresh CDK bootstrap and deployment!"
echo "⚠️  REMEMBER: Remove this script before pushing to CI/CD"
echo ""
