#!/bin/bash

# LocalStack CloudFormation Deploy Script
# This script deploys CloudFormation infrastructure to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CloudFormation Deploy to LocalStack...${NC}"

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

# Check if CloudFormation template exists
TEMPLATE_FILE="TapStack.yml"
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ CloudFormation template not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CloudFormation template found: $TEMPLATE_FILE${NC}"

# Set stack name and parameters
STACK_NAME="tap-stack-localstack"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

echo -e "${YELLOW}🔧 Deploying CloudFormation stack...${NC}"
echo -e "${BLUE}  • Stack Name: $STACK_NAME${NC}"
echo -e "${BLUE}  • Environment Suffix: $ENVIRONMENT_SUFFIX${NC}"

# Check if stack exists
if awslocal cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Stack exists, updating...${NC}"

    awslocal cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX \
        --capabilities CAPABILITY_IAM || {
            # Check if the error is due to no changes
            if awslocal cloudformation describe-stacks --stack-name $STACK_NAME | grep -q "UPDATE_COMPLETE\|CREATE_COMPLETE"; then
                echo -e "${YELLOW}⚠️  No updates to be performed${NC}"
            else
                echo -e "${RED}❌ Stack update failed${NC}"
                exit 1
            fi
        }

    echo -e "${YELLOW}⏳ Waiting for stack update to complete...${NC}"
    awslocal cloudformation wait stack-update-complete --stack-name $STACK_NAME || true
else
    echo -e "${YELLOW}📦 Creating new stack...${NC}"

    awslocal cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX \
        --capabilities CAPABILITY_IAM

    echo -e "${YELLOW}⏳ Waiting for stack creation to complete...${NC}"
    awslocal cloudformation wait stack-create-complete --stack-name $STACK_NAME
fi

echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"

# Get stack outputs
echo -e "${YELLOW}📊 Retrieving stack outputs...${NC}"

# Create cfn-outputs directory if it doesn't exist
mkdir -p ../cfn-outputs

# Get stack description and extract outputs
STACK_INFO=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME)

# Parse outputs to JSON format compatible with integration tests
echo "$STACK_INFO" | python3 -c "
import sys
import json

data = json.load(sys.stdin)
outputs = {}

# Extract outputs from CloudFormation stack
for output in data['Stacks'][0].get('Outputs', []):
    key = output['OutputKey']
    value = output['OutputValue']
    outputs[key] = value

# Write outputs in flat format for integration tests
with open('../cfn-outputs/flat-outputs.json', 'w') as f:
    json.dump(outputs, f, indent=2)

print(json.dumps(outputs, indent=2))
"

echo -e "${GREEN}✅ Outputs saved to cfn-outputs/flat-outputs.json${NC}"

# Display stack outputs
echo -e "${BLUE}📈 Stack Outputs:${NC}"
echo "$STACK_INFO" | python3 -c "
import sys
import json

data = json.load(sys.stdin)
for output in data['Stacks'][0].get('Outputs', []):
    print(f\"  • {output['OutputKey']}: {output['OutputValue']}\")
"

# Display summary
echo -e "${BLUE}📈 Deployment Summary:${NC}"
echo -e "${YELLOW}  • Stack Name: $STACK_NAME${NC}"
echo -e "${YELLOW}  • Stack Status: $(echo "$STACK_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['Stacks'][0]['StackStatus'])")${NC}"
echo -e "${YELLOW}  • Infrastructure deployed to LocalStack${NC}"
echo -e "${YELLOW}  • Outputs file created for integration tests${NC}"
echo -e "${YELLOW}  • LocalStack endpoint: http://localhost:4566${NC}"

echo -e "${GREEN}🎉 Ready to run integration tests!${NC}"
