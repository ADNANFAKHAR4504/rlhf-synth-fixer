#!/bin/bash
# Minimal LocalStack Bootstrap for CDK (ECR-free)
# This script creates only the SSM parameter that CDK checks for bootstrap status
# It does NOT use ECR which is a Pro-only feature

set -e

echo "Setting up minimal LocalStack CDK bootstrap..."

# Create SSM parameter for bootstrap version
awslocal ssm put-parameter \
    --name "/cdk-bootstrap/hnb659fds/version" \
    --type "String" \
    --value "14" \
    --overwrite 2>/dev/null || echo "Parameter already exists"

# Create S3 bucket for CDK assets
awslocal s3 mb s3://cdk-hnb659fds-assets-000000000000-us-east-1 2>/dev/null || echo "Bucket already exists"

echo "Minimal bootstrap completed successfully"
