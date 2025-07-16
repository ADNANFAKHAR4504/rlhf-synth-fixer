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

# Step 1: Deploy the stack to create S3 bucket (without Lambda function)
echo "📦 Step 1: Creating S3 bucket for Lambda deployment..."

# Temporarily remove Lambda function from template for initial deployment
cp "$PROJECT_ROOT/lib/TapStack.yml" "$PROJECT_ROOT/lib/TapStack-temp.yml"

# Comment out the Lambda function resource temporarily
sed -i.bak '/RDSTesterLambdaFunction:/,/^  [A-Z]/s/^/#/' "$PROJECT_ROOT/lib/TapStack-temp.yml" || true

aws cloudformation deploy \
  --template-file "$PROJECT_ROOT/lib/TapStack-temp.yml" \
  --stack-name "$STACK_NAME" \
  --parameter-overrides EnvironmentSuffix="$ENVIRONMENT_SUFFIX" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" || true

# Get the bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaDeploymentBucketName`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [[ -z "$BUCKET_NAME" ]]; then
  BUCKET_NAME="lambda-deployment-${ENVIRONMENT_SUFFIX}-$(aws sts get-caller-identity --query Account --output text)"
  echo "📝 Using default bucket name: $BUCKET_NAME"
fi

# Step 2: Build and upload Lambda package
echo "🔨 Step 2: Building and uploading Lambda package..."
export LAMBDA_DEPLOYMENT_BUCKET="$BUCKET_NAME"
"$SCRIPT_DIR/build-lambda.sh"

# Step 3: Deploy complete stack with Lambda function
echo "🚀 Step 3: Deploying complete stack with Lambda function..."
rm -f "$PROJECT_ROOT/lib/TapStack-temp.yml" "$PROJECT_ROOT/lib/TapStack-temp.yml.bak"

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