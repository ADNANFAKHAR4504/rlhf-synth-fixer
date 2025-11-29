#!/bin/bash

# LocalStack Terraform Cleanup Script
# This script cleans up all Terraform temporary files and LocalStack resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Starting Terraform LocalStack Cleanup...${NC}"

# Change to lib directory
cd "$(dirname "$0")/../lib"

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Clean up Terraform files
echo -e "${YELLOW}🗂️  Removing Terraform temporary files...${NC}"
rm -f localstack_providers_override.tf
rm -f tfplan
rm -f .terraform.lock.hcl
rm -rf .terraform/

# Clean up outputs
echo -e "${YELLOW}📊 Removing output files...${NC}"
rm -rf ../cfn-outputs/

# Destroy Terraform infrastructure
echo -e "${YELLOW}🗑️  Destroying Terraform infrastructure...${NC}"
read -p "Do you want to destroy the deployed Terraform infrastructure? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Set up LocalStack environment
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export AWS_DEFAULT_REGION=us-east-1
    export AWS_ENDPOINT_URL=http://localhost:4566
    
    # Initialize tflocal path
    TFLOCAL_PATH="../.venv/bin/tflocal"
    if [ -f "$TFLOCAL_PATH" ]; then
        echo -e "${YELLOW}🔧 Initializing Terraform for destroy...${NC}"
        
        # Create S3 bucket for state if it doesn't exist (needed for destroy)
        awslocal s3 mb s3://terraform-state-localstack --region us-east-1 || true
        
        # Initialize Terraform
        $TFLOCAL_PATH init \
            -backend-config="bucket=terraform-state-localstack" \
            -backend-config="key=terraform.tfstate" \
            -backend-config="region=us-east-1" \
            -backend-config="endpoint=http://localhost:4566" \
            -backend-config="force_path_style=true" \
            -backend-config="skip_credentials_validation=true" \
            -backend-config="skip_metadata_api_check=true" || true
        
        echo -e "${RED}💥 Destroying infrastructure...${NC}"
        $TFLOCAL_PATH destroy -var-file="terraform.tfvars" -auto-approve || true
        
        echo -e "${GREEN}✅ Infrastructure destroyed${NC}"
    else
        echo -e "${RED}❌ tflocal not found, skipping infrastructure destroy${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping infrastructure destroy${NC}"
fi

# Clean up LocalStack S3 bucket (optional)
read -p "Do you want to remove the LocalStack S3 state bucket? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing LocalStack S3 bucket...${NC}"
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export AWS_DEFAULT_REGION=us-east-1
    export AWS_ENDPOINT_URL=http://localhost:4566
    
    # Try to empty and delete the bucket using awslocal
    awslocal s3 rm s3://terraform-state-localstack --recursive || true
    awslocal s3 rb s3://terraform-state-localstack || true
    echo -e "${GREEN}✅ S3 bucket removed${NC}"
fi

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo -e "${BLUE}💡 All temporary files and resources have been cleaned up${NC}"