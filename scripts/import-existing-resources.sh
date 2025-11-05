#!/bin/bash
#
# Import Existing AWS Resources into Terraform State
# 
# This script imports pre-existing AWS resources into the Terraform state
# to avoid "resource already exists" errors on deployment.
#
# Usage: ./scripts/import-existing-resources.sh
#

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      Importing Existing AWS Resources into Terraform State     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get environment variables
ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "Configuration:"
echo "  Environment Suffix: ${ENVIRONMENT_SUFFIX}"
echo "  AWS Region: ${AWS_REGION}"
echo ""

# Navigate to the synthesized Terraform directory
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
STACK_DIR="cdktf.out/stacks/${STACK_NAME}"

if [ ! -d "${STACK_DIR}" ]; then
  echo "❌ Error: Stack directory not found: ${STACK_DIR}"
  echo "   Please run 'cdktf synth' first"
  exit 1
fi

cd "${STACK_DIR}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Step 1: Initialize Terraform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
terraform init
echo "✅ Terraform initialized"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Step 2: Import Existing Resources"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to import resource if it exists in AWS
import_resource() {
  local resource_address=$1
  local resource_id=$2
  local resource_name=$3
  
  echo ""
  echo "→ Importing: ${resource_name}"
  echo "  Address: ${resource_address}"
  echo "  ID: ${resource_id}"
  
  if terraform import "${resource_address}" "${resource_id}" 2>&1 | grep -q "Resource already managed"; then
    echo "  ℹ️  Already in state"
  elif terraform import "${resource_address}" "${resource_id}" 2>&1; then
    echo "  ✅ Imported successfully"
  else
    echo "  ⚠️  Import failed (resource may not exist in AWS)"
  fi
}

# Import CloudWatch Log Groups
import_resource \
  "aws_cloudwatch_log_group.api_log_group" \
  "/aws/apigateway/reviews-api-${ENVIRONMENT_SUFFIX}" \
  "API Gateway Log Group"

import_resource \
  "aws_cloudwatch_log_group.lambda_log_group" \
  "/aws/lambda/review-processor-${ENVIRONMENT_SUFFIX}" \
  "Lambda Log Group"

# Import DynamoDB Table
import_resource \
  "aws_dynamodb_table.reviews_table" \
  "product-reviews-${ENVIRONMENT_SUFFIX}" \
  "DynamoDB Table"

# Import S3 Bucket
import_resource \
  "aws_s3_bucket.images_bucket" \
  "review-images-${ENVIRONMENT_SUFFIX}" \
  "S3 Bucket"

# Import IAM Role (if it exists)
import_resource \
  "aws_iam_role.lambda_role" \
  "review-processor-role-${ENVIRONMENT_SUFFIX}" \
  "Lambda IAM Role"

# Import Lambda Function (if it exists)
import_resource \
  "aws_lambda_function.review_processor" \
  "review-processor-${ENVIRONMENT_SUFFIX}" \
  "Lambda Function"

# Import API Gateway (if it exists)
# Note: API Gateway import requires the REST API ID, which we'd need to look up
echo ""
echo "ℹ️  Note: API Gateway resources require manual import with their IDs"
echo "   Run: aws apigateway get-rest-apis --query 'items[?name==\`reviews-api-${ENVIRONMENT_SUFFIX}\`].id' --output text"
echo "   Then: terraform import aws_api_gateway_rest_api.reviews_api <API_ID>"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Step 3: Verify State"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running terraform plan to check for remaining differences..."
terraform plan -no-color | head -50

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     Import Complete!                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Review the terraform plan output above"
echo "  2. If there are still 'create' operations for existing resources,"
echo "     they may need to be imported manually"
echo "  3. Run 'cdktf deploy' to apply any legitimate changes"
echo ""

