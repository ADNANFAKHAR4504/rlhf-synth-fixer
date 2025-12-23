#!/bin/bash

# LocalStack Pulumi Cleanup Script
# This script cleans up Pulumi stacks and LocalStack resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Starting Pulumi LocalStack Cleanup...${NC}"

# Change to project root (where Pulumi.yaml is located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Single confirmation
echo -n -e "${YELLOW}Do you want to cleanup all Pulumi LocalStack resources? (y/N): ${NC}"
read -r REPLY
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏭️  Cleanup cancelled${NC}"
    exit 0
fi

# Set up LocalStack environment
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export PULUMI_CONFIG_PASSPHRASE=""

# Clean up output files
echo -e "${YELLOW}📊 Checking output files...${NC}"
if [ -d "cfn-outputs" ]; then
    rm -rf cfn-outputs/
    echo -e "${GREEN}✅ Output files removed${NC}"
else
    echo -e "${YELLOW}⚠️  Output files do not exist${NC}"
fi

# Clean up Python build artifacts
if [ -d "*.egg-info" ] || [ -d "iac_test_automations.egg-info" ]; then
    rm -rf *.egg-info iac_test_automations.egg-info 2>/dev/null || true
    echo -e "${GREEN}✅ Python build artifacts removed${NC}"
fi
if [ -d "build" ]; then
    rm -rf build/
    echo -e "${GREEN}✅ Build directory removed${NC}"
fi
if [ -d "dist" ]; then
    rm -rf dist/
    echo -e "${GREEN}✅ Dist directory removed${NC}"
fi

# Check if Pulumi.yaml exists
if [ ! -f "Pulumi.yaml" ]; then
    echo -e "${YELLOW}⚠️  Pulumi.yaml not found, skipping stack destruction${NC}"
else
    # Check if pulumi is available
    if ! command -v pulumi &> /dev/null; then
        echo -e "${YELLOW}⚠️  Pulumi CLI not found, skipping stack destruction${NC}"
    else
        # Set up local backend
        if [ -d ".pulumi-state" ]; then
            pulumi login --local >/dev/null 2>&1 || true
            
            ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
            STACK_NAME="localstack-${ENVIRONMENT_SUFFIX}"
            
            # Check if stack exists
            if pulumi stack select $STACK_NAME 2>/dev/null; then
                echo -e "${RED}💥 Destroying Pulumi stack: $STACK_NAME${NC}"
                
                # Destroy the stack
                pulumi destroy --yes 2>/dev/null || true
                
                # Remove the stack
                echo -e "${YELLOW}🗑️  Removing stack: $STACK_NAME${NC}"
                pulumi stack rm $STACK_NAME --yes 2>/dev/null || true
                
                echo -e "${GREEN}✅ Pulumi stack destroyed${NC}"
            else
                echo -e "${YELLOW}⚠️  Pulumi stack does not exist${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Pulumi state directory does not exist${NC}"
        fi
    fi
fi

# Clean up Pulumi state directory
echo -e "${YELLOW}🗂️  Checking Pulumi state directory...${NC}"
if [ -d ".pulumi-state" ]; then
    rm -rf .pulumi-state/
    echo -e "${GREEN}✅ Pulumi state directory removed${NC}"
else
    echo -e "${YELLOW}⚠️  Pulumi state directory does not exist${NC}"
fi

# Clean up Pulumi config files
echo -e "${YELLOW}🗂️  Checking Pulumi config files...${NC}"
PULUMI_CONFIGS=$(ls Pulumi.*.yaml 2>/dev/null || echo "")
if [ ! -z "$PULUMI_CONFIGS" ]; then
    for config in $PULUMI_CONFIGS; do
        if [[ "$config" == *"localstack"* ]]; then
            rm -f "$config"
            echo -e "${BLUE}  🗑️  Removed: $config${NC}"
        fi
    done
    echo -e "${GREEN}✅ Pulumi config files cleaned${NC}"
else
    echo -e "${YELLOW}⚠️  No Pulumi stack config files found${NC}"
fi

# Check if LocalStack is running for additional cleanup
if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${YELLOW}🗑️  Checking LocalStack resources...${NC}"
    
    # Clean up any Pulumi-related S3 buckets
    PULUMI_BUCKETS=$(awslocal s3 ls 2>/dev/null | grep -E 'pulumi-' | awk '{print $3}' || echo "")
    
    if [ ! -z "$PULUMI_BUCKETS" ]; then
        for bucket in $PULUMI_BUCKETS; do
            echo -e "${BLUE}  🗑️  Deleting bucket: $bucket${NC}"
            awslocal s3api delete-objects --bucket $bucket --delete "$(awslocal s3api list-object-versions --bucket $bucket --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json 2>/dev/null)" >/dev/null 2>&1 || true
            awslocal s3api delete-objects --bucket $bucket --delete "$(awslocal s3api list-object-versions --bucket $bucket --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' --output json 2>/dev/null)" >/dev/null 2>&1 || true
            awslocal s3 rm s3://$bucket --recursive >/dev/null 2>&1 || true
            awslocal s3 rb s3://$bucket --force >/dev/null 2>&1 || true
        done
        echo -e "${GREEN}✅ Pulumi S3 buckets removed${NC}"
    else
        echo -e "${YELLOW}⚠️  No Pulumi S3 buckets found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  LocalStack is not running, skipping LocalStack resource cleanup${NC}"
fi

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"

