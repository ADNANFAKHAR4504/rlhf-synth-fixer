#!/bin/bash

# LocalStack CloudFormation Plan Script
# This script validates CloudFormation template deployment to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CloudFormation Plan for LocalStack...${NC}"

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
TEMPLATE_FILE=null;

# Check if CloudFormation template exists
if [ -f "TapStack.yml" ]; then
    echo -e "${GREEN}❌ CloudFormation yml template found: TapStack.yml${NC}"
    TEMPLATE_FILE="TapStack.yml"
elif [ -f "TapStack.json" ]; then
    echo -e "${GREEN}✅ CloudFormation json template found: TapStack.json${NC}"
    TEMPLATE_FILE="TapStack.json"
else
    echo -e "${RED}❌ No CloudFormation template found (TapStack.yml or TapStack.json)${NC}"
    exit 1    
fi

echo -e "${GREEN}✅ CloudFormation template found: $TEMPLATE_FILE${NC}"

# Validate CloudFormation template
echo -e "${YELLOW}🔍 Validating CloudFormation template...${NC}"
if awslocal cloudformation validate-template --template-body file://$TEMPLATE_FILE > /dev/null; then
    echo -e "${GREEN}✅ CloudFormation template is valid${NC}"
else
    echo -e "${RED}❌ CloudFormation template validation failed${NC}"
    exit 1
fi

# Generate change set for preview (if stack exists)
STACK_NAME="tap-stack-localstack"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

echo -e "${YELLOW}📋 Checking if stack exists...${NC}"
if awslocal cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
    echo -e "${YELLOW}📋 Stack exists, creating change set for preview...${NC}"

    CHANGE_SET_NAME="changeset-$(date +%s)"
    awslocal cloudformation create-change-set \
        --stack-name $STACK_NAME \
        --change-set-name $CHANGE_SET_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX \
        --capabilities CAPABILITY_IAM

    echo -e "${YELLOW}⏳ Waiting for change set to be created...${NC}"
    awslocal cloudformation wait change-set-create-complete \
        --stack-name $STACK_NAME \
        --change-set-name $CHANGE_SET_NAME || true

    echo -e "${GREEN}✅ Change set created: $CHANGE_SET_NAME${NC}"
    echo -e "${YELLOW}📊 Change set details:${NC}"
    awslocal cloudformation describe-change-set \
        --stack-name $STACK_NAME \
        --change-set-name $CHANGE_SET_NAME

    echo -e "${YELLOW}💡 To apply this change set, run: ./scripts/localstack-cloudformation-deploy.sh${NC}"
else
    echo -e "${YELLOW}📋 Stack does not exist, will create new stack on deploy${NC}"
    echo -e "${GREEN}✅ Template is valid and ready for deployment${NC}"
    echo -e "${YELLOW}💡 To deploy this stack, run: ./scripts/localstack-cloudformation-deploy.sh${NC}"
fi

echo -e "${GREEN}🎉 CloudFormation Plan completed successfully!${NC}"
