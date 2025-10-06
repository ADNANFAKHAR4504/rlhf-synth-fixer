#!/bin/bash

# LocalStack CloudFormation Cleanup Script
# This script cleans up CloudFormation stack and LocalStack resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Starting CloudFormation LocalStack Cleanup...${NC}"

# Change to lib directory
cd "$(dirname "$0")/../lib"

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Clean up outputs
echo -e "${YELLOW}📊 Removing output files...${NC}"
rm -rf ../cfn-outputs/
echo -e "${GREEN}✅ Output files removed${NC}"

# Destroy CloudFormation stack
echo -e "${YELLOW}🗑️  Destroying CloudFormation infrastructure...${NC}"
read -p "Do you want to delete the CloudFormation stack? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Set up LocalStack environment
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export AWS_DEFAULT_REGION=us-east-1
    export AWS_ENDPOINT_URL=http://localhost:4566

    STACK_NAME="tap-stack-localstack"

    # Check if stack exists
    if awslocal cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
        echo -e "${RED}💥 Deleting CloudFormation stack...${NC}"

        awslocal cloudformation delete-stack --stack-name $STACK_NAME

        echo -e "${YELLOW}⏳ Waiting for stack deletion to complete...${NC}"
        awslocal cloudformation wait stack-delete-complete --stack-name $STACK_NAME || true

        echo -e "${GREEN}✅ CloudFormation stack deleted successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Stack does not exist, nothing to delete${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping stack deletion${NC}"
fi

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo -e "${BLUE}💡 All temporary files and resources have been cleaned up${NC}"
