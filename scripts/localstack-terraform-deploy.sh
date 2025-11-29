#!/bin/bash

# LocalStack Terraform Deploy Script
# This script deploys Terraform infrastructure to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Terraform Deploy to LocalStack...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Change to lib directory
cd "$(dirname "$0")/../lib"

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Clean up any existing override files
cleanup_files() {
    echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
    rm -f localstack_providers_override.tf
    rm -f tfplan
    rm -f .terraform.lock.hcl
    rm -rf .terraform/
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set trap to cleanup on exit
trap cleanup_files EXIT

# Initialize tflocal path
TFLOCAL_PATH="../.venv/bin/tflocal"
if [ ! -f "$TFLOCAL_PATH" ]; then
    echo -e "${RED}❌ tflocal not found at $TFLOCAL_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Initializing Terraform with LocalStack...${NC}"

# Create S3 bucket for state if it doesn't exist
echo -e "${YELLOW}📦 Creating S3 bucket for Terraform state...${NC}"
awslocal s3 mb s3://terraform-state-localstack --region us-east-1 || true

# Initialize Terraform
$TFLOCAL_PATH init \
    -backend-config="bucket=terraform-state-localstack" \
    -backend-config="key=terraform.tfstate" \
    -backend-config="region=us-east-1" \
    -backend-config="endpoint=http://localhost:4566" \
    -backend-config="force_path_style=true" \
    -backend-config="skip_credentials_validation=true" \
    -backend-config="skip_metadata_api_check=true"

echo -e "${GREEN}✅ Terraform initialized successfully${NC}"

# Check if plan file exists
if [ -f "tfplan" ]; then
    echo -e "${BLUE}📋 Found existing plan file, applying...${NC}"
    $TFLOCAL_PATH apply tfplan
else
    echo -e "${YELLOW}📋 No plan file found, running plan and apply...${NC}"
    $TFLOCAL_PATH plan -var-file="terraform.tfvars" -out=tfplan
    $TFLOCAL_PATH apply tfplan
fi

echo -e "${GREEN}🎉 Terraform deployment completed successfully!${NC}"

# Generate outputs for integration tests
echo -e "${YELLOW}📊 Generating outputs for integration tests...${NC}"

# Create cfn-outputs directory if it doesn't exist
mkdir -p ../cfn-outputs

# Export outputs to JSON format for integration tests
$TFLOCAL_PATH output -json > ../cfn-outputs/flat-outputs.json

echo -e "${GREEN}✅ Outputs saved to cfn-outputs/flat-outputs.json${NC}"

# Display summary
echo -e "${BLUE}📈 Deployment Summary:${NC}"
echo -e "${YELLOW}  • Infrastructure deployed to LocalStack${NC}"
echo -e "${YELLOW}  • Outputs file created for integration tests${NC}"
echo -e "${YELLOW}  • LocalStack endpoint: http://localhost:4566${NC}"

echo -e "${GREEN}🎉 Ready to run integration tests!${NC}"