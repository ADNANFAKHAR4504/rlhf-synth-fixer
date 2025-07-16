#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
STACK_NAME="${STACK_NAME:-tap-stack}"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying TAP Stack with Lambda dependencies..."
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT_SUFFIX"
echo "Region: $REGION"

# Step 1: Get or create the S3 bucket name
BUCKET_NAME="lambda-deployment-${ENVIRONMENT_SUFFIX}-$(aws sts get-caller-identity --query Account --output text)"
echo "📦 Using S3 bucket: $BUCKET_NAME"

# Step 2: Build and upload Lambda package FIRST
echo "🔨 Building and uploading Lambda package..."
export LAMBDA_DEPLOYMENT_BUCKET="$BUCKET_NAME"

# Create bucket if it doesn't exist
aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" 2>/dev/null || echo "Bucket already exists"

# Build and upload Lambda package
"$SCRIPT_DIR/build-lambda.sh"

# Verify the package was uploaded
echo "✅ Verifying Lambda package in S3..."
aws s3 ls "s3://$BUCKET_NAME/rds-tester-lambda.zip" || {
    echo "❌ Lambda package not found in S3"
    exit 1
}

# Step 3: Deploy CloudFormation stack
echo "🚀 Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file "$PROJECT_ROOT/lib/TapStack.yml" \
  --stack-name "$STACK_NAME" \
  --parameter-overrides EnvironmentSuffix="$ENVIRONMENT_SUFFIX" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION"

echo "✅ Deployment completed successfully!"
echo "🔗 Stack outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table