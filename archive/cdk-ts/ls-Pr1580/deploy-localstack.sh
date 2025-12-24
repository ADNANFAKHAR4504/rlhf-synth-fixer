#!/bin/bash
set -euo pipefail

# LocalStack environment configuration
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Stack configuration
export STACK_NAME=tap-stack-pr1580
export PROJECT_NAME=tap-financial-services
export OFFICE_CIDR=10.0.0.0/8
export DEVOPS_EMAIL=devops@example.com
export DB_USERNAME=admin
export ENVIRONMENT_SUFFIX=dev

echo "========================================"
echo "LocalStack CDK Deployment"
echo "========================================"
echo "Stack Name: $STACK_NAME"
echo "Endpoint: $AWS_ENDPOINT_URL"
echo ""

# Bootstrap CDK (if not already done)
echo "Step 1: Bootstrapping CDK..."
npx cdk bootstrap \
  --require-approval never \
  --context environmentSuffix=$ENVIRONMENT_SUFFIX 2>&1 | tail -10 || echo "Bootstrap may have failed, continuing..."

echo ""
echo "Step 2: Synthesizing stack..."
npx cdk synth \
  --context environmentSuffix=$ENVIRONMENT_SUFFIX \
  2>&1 | head -50

echo ""
echo "Step 3: Deploying to LocalStack..."
npx cdk deploy --all \
  --require-approval never \
  --method=direct \
  --context environmentSuffix=$ENVIRONMENT_SUFFIX \
  2>&1 | tee deployment-output.log

echo ""
echo "Deployment complete!"
echo "Output saved to: deployment-output.log"
