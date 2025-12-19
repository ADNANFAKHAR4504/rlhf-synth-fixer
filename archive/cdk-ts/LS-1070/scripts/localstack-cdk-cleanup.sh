#!/bin/bash

# LocalStack CDK Cleanup Script
# This script cleans up CDK stacks and LocalStack resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Starting CDK LocalStack Cleanup...${NC}"

# Change to project root (where cdk.json is located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Single confirmation
echo -n -e "${YELLOW}Do you want to cleanup all CDK LocalStack resources? (y/N): ${NC}"
read -r REPLY
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏭️  Cleanup cancelled${NC}"
    exit 0
fi

# Set up LocalStack environment
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566
export AWS_S3_FORCE_PATH_STYLE=true
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Clean up CDK output files
echo -e "${YELLOW}🗂️  Checking CDK temporary files...${NC}"
if [ -d "cdk.out" ] || [ -d ".cdk.staging" ]; then
    rm -rf cdk.out/
    rm -rf .cdk.staging/
    echo -e "${GREEN}✅ CDK temporary files removed${NC}"
else
    echo -e "${YELLOW}⚠️  CDK temporary files do not exist${NC}"
fi

# Clean up outputs
echo -e "${YELLOW}📊 Checking output files...${NC}"
if [ -d "cfn-outputs" ]; then
    rm -rf cfn-outputs/
    echo -e "${GREEN}✅ Output files removed${NC}"
else
    echo -e "${YELLOW}⚠️  Output files do not exist${NC}"
fi

# Check if cdklocal is available
CDKLOCAL_PATH=""
if command -v cdklocal &> /dev/null; then
    CDKLOCAL_PATH="cdklocal"
elif [ -f ".venv/bin/cdklocal" ]; then
    CDKLOCAL_PATH=".venv/bin/cdklocal"
elif [ -f "./node_modules/.bin/cdklocal" ]; then
    CDKLOCAL_PATH="./node_modules/.bin/cdklocal"
else
    CDKLOCAL_PATH="npx aws-cdk-local"
fi

# Destroy CDK infrastructure
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

# Check if LocalStack is running
if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    # Destroy CDK stack
    if awslocal cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
        echo -e "${RED}💥 Destroying CDK stack: $STACK_NAME${NC}"

        # Try using cdklocal destroy first
        if [ -f "cdk.json" ]; then
            echo -e "${YELLOW}🔧 Using cdklocal destroy...${NC}"
            $CDKLOCAL_PATH destroy \
                --context environmentSuffix=$ENVIRONMENT_SUFFIX \
                --all \
                --force 2>/dev/null || true
        fi

        # Fallback to direct CloudFormation delete if stack still exists
        if awslocal cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
            echo -e "${YELLOW}🔧 Using CloudFormation delete-stack...${NC}"
            awslocal cloudformation delete-stack --stack-name $STACK_NAME

            echo -e "${YELLOW}⏳ Waiting for stack deletion to complete...${NC}"
            
            # Monitor deletion progress
            while true; do
                STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DELETE_COMPLETE")

                if [[ "$STACK_STATUS" == "DELETE_COMPLETE" ]] || [[ "$STACK_STATUS" == "UNKNOWN" ]]; then
                    echo -e "${GREEN}✅ Stack deletion completed${NC}"
                    break
                elif [[ "$STACK_STATUS" == "DELETE_FAILED" ]]; then
                    echo -e "${RED}❌ Stack deletion failed${NC}"
                    break
                else
                    echo -e "${BLUE}⏳ Stack status: $STACK_STATUS${NC}"
                fi

                sleep 3
            done
        fi

        echo -e "${GREEN}✅ CDK stack destroyed${NC}"
    else
        echo -e "${YELLOW}⚠️  CDK stack does not exist${NC}"
    fi

    # Remove CDK Bootstrap stack
    echo -e "${YELLOW}🗑️  Checking CDK Bootstrap stack...${NC}"
    if awslocal cloudformation describe-stacks --stack-name CDKToolkit > /dev/null 2>&1; then
        awslocal cloudformation delete-stack --stack-name CDKToolkit
        echo -e "${GREEN}✅ CDK Bootstrap stack removed${NC}"
    else
        echo -e "${YELLOW}⚠️  CDK Bootstrap stack does not exist${NC}"
    fi

    # Remove CDK staging S3 buckets
    echo -e "${YELLOW}🗑️  Checking CDK staging S3 buckets...${NC}"
    CDK_BUCKETS=$(awslocal s3 ls 2>/dev/null | grep -E 'cdk-|cdktoolkit-' | awk '{print $3}' || echo "")
    
    if [ ! -z "$CDK_BUCKETS" ]; then
        for bucket in $CDK_BUCKETS; do
            echo -e "${BLUE}  🗑️  Deleting bucket: $bucket${NC}"
            # Delete all objects including versions
            awslocal s3api delete-objects --bucket $bucket --delete "$(awslocal s3api list-object-versions --bucket $bucket --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json 2>/dev/null)" >/dev/null 2>&1 || true
            awslocal s3api delete-objects --bucket $bucket --delete "$(awslocal s3api list-object-versions --bucket $bucket --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' --output json 2>/dev/null)" >/dev/null 2>&1 || true
            # Remove all objects
            awslocal s3 rm s3://$bucket --recursive >/dev/null 2>&1 || true
            # Force remove bucket
            awslocal s3 rb s3://$bucket --force >/dev/null 2>&1 || true
        done
        echo -e "${GREEN}✅ CDK staging buckets removed${NC}"
    else
        echo -e "${YELLOW}⚠️  CDK staging buckets do not exist${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  LocalStack is not running, skipping stack destruction${NC}"
fi

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
