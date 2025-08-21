#!/bin/bash

# Integration Test Runner
# This script runs the infrastructure integration tests with proper AWS configuration

set -e

echo "🚀 Starting Infrastructure Integration Tests"
echo "=============================================="

# Check if AWS credentials are configured
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -z "$AWS_PROFILE" ]; then
    echo "❌ AWS credentials not found!"
    echo "   Please set one of the following:"
    echo "   - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo "   - AWS_PROFILE"
    echo "   - Run 'aws configure' to set up credentials"
    exit 1
fi

# Set default region if not provided
if [ -z "$AWS_REGION" ]; then
    export AWS_REGION="us-west-2"
    echo "📍 Using default region: $AWS_REGION"
else
    echo "📍 Using region: $AWS_REGION"
fi

# Verify AWS credentials
echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity

# Check if infrastructure is deployed
echo "🏗️  Checking if infrastructure is deployed..."
cd lib
if ! terraform state list > /dev/null 2>&1; then
    echo "❌ Terraform state not found. Please deploy infrastructure first:"
    echo "   cd lib && terraform apply"
    exit 1
fi

# Get resource names from Terraform outputs
echo "📋 Getting resource names from Terraform outputs..."
VPC_ID=$(terraform output -raw vpc_id 2>/dev/null || echo "vpc-0abc123de456")
RDS_IDENTIFIER=$(terraform output -raw rds_identifier 2>/dev/null || echo "secure-infra-prod-rds")
CLOUDTRAIL_NAME=$(terraform output -raw cloudtrail_name 2>/dev/null || echo "secure-infra-prod-cloudtrail")

echo "   VPC ID: $VPC_ID"
echo "   RDS Identifier: $RDS_IDENTIFIER"
echo "   CloudTrail Name: $CLOUDTRAIL_NAME"

cd ..

# Export variables for tests
export TEST_VPC_ID="$VPC_ID"
export TEST_RDS_IDENTIFIER="$RDS_IDENTIFIER"
export TEST_CLOUDTRAIL_NAME="$CLOUDTRAIL_NAME"

# Run the integration tests
echo "🧪 Running integration tests..."
npm run test:integration

echo "✅ Integration tests completed!"
