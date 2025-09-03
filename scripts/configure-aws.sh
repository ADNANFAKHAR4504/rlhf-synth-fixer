#!/bin/bash

# Exit on any error
set -e

echo "🔧 Configuring AWS credentials..."

# Validate required environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "❌ AWS_ACCESS_KEY_ID environment variable is required"
  exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "❌ AWS_SECRET_ACCESS_KEY environment variable is required"
  exit 1
fi

# Set default region if not provided
AWS_REGION=${AWS_REGION:-us-east-1}

echo "Setting up AWS credentials with region: $AWS_REGION"

# Configure AWS CLI
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"

# Set region environment variables
if [ -f "lib/AWS_REGION" ]; then
  CUSTOM_REGION=$(cat lib/AWS_REGION | tr -d '[:space:]')
  echo "Using custom AWS region from lib/AWS_REGION: $CUSTOM_REGION"
  AWS_REGION="$CUSTOM_REGION"
else
  echo "No custom region file found, using default region: $AWS_REGION"
fi

echo "Setting AWS_REGION and CDK_DEFAULT_REGION to: $AWS_REGION"

# Export environment variables for current session
export AWS_REGION="$AWS_REGION"
export AWS_DEFAULT_REGION="$AWS_REGION" 
export CDK_DEFAULT_REGION="$AWS_REGION"

# For GitHub Actions, also set in GITHUB_ENV if available
if [ -n "$GITHUB_ENV" ]; then
  echo "AWS_REGION=$AWS_REGION" >> "$GITHUB_ENV"
  echo "AWS_DEFAULT_REGION=$AWS_REGION" >> "$GITHUB_ENV"
  echo "CDK_DEFAULT_REGION=$AWS_REGION" >> "$GITHUB_ENV"
fi

echo "✅ AWS configuration completed"
echo "Current AWS_REGION: $AWS_REGION"
echo "Current AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION"
echo "Current CDK_DEFAULT_REGION: $CDK_DEFAULT_REGION"
echo "aws-cli configured region: $(aws configure get region)"