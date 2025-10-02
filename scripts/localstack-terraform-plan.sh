#!/bin/bash

# LocalStack Terraform Plan Script
# This script plans Terraform infrastructure deployment to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Terraform Plan for LocalStack...${NC}"

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

# Run terraform plan
echo -e "${YELLOW}📋 Running Terraform Plan...${NC}"
$TFLOCAL_PATH plan -var-file="terraform.tfvars" -out=tfplan

echo -e "${GREEN}🎉 Terraform Plan completed successfully!${NC}"
echo -e "${YELLOW}💡 Plan file saved as 'tfplan'${NC}"
echo -e "${YELLOW}💡 To apply this plan, run: ./scripts/localstack-terraform-deploy.sh${NC}"