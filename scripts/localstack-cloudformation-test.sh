#!/bin/bash

# LocalStack Integration Test Script
# Runs integration tests against LocalStack CloudFormation deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running Integration Tests against LocalStack...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    echo -e "${YELLOW}💡 Run: npm run localstack:start${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Check if infrastructure is deployed
OUTPUTS_FILE="cfn-outputs/flat-outputs.json"
if [ ! -f "$OUTPUTS_FILE" ]; then
    echo -e "${RED}❌ Infrastructure outputs not found at: $OUTPUTS_FILE${NC}"
    echo -e "${YELLOW}💡 Deploy infrastructure first: npm run localstack:cfn:deploy${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure outputs found${NC}"

# Validate outputs file is not empty
if [ ! -s "$OUTPUTS_FILE" ]; then
    echo -e "${RED}❌ Infrastructure outputs file is empty${NC}"
    echo -e "${YELLOW}💡 Redeploy infrastructure: npm run localstack:cfn:deploy${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure outputs validated${NC}"

# Install npm dependencies
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Set up environment variables for LocalStack
echo -e "${YELLOW}🔧 Setting up LocalStack environment...${NC}"

# AWS SDK configuration for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1

# LocalStack endpoint configuration
export AWS_ENDPOINT_URL=http://localhost:4566

# Additional LocalStack-specific settings
export AWS_USE_SSL=false
export AWS_VERIFY_SSL=false
export AWS_CLI_AUTO_PROMPT=off

# Force SDK to use LocalStack
export AWS_CONFIG_FILE=/dev/null
export AWS_SHARED_CREDENTIALS_FILE=/dev/null

# Override service endpoints for AWS SDK v3
export AWS_ENDPOINT_URL_EC2=http://localhost:4566
export AWS_ENDPOINT_URL_RDS=http://localhost:4566
export AWS_ENDPOINT_URL_S3=http://localhost:4566
export AWS_ENDPOINT_URL_IAM=http://localhost:4566
export AWS_ENDPOINT_URL_LAMBDA=http://localhost:4566
export AWS_ENDPOINT_URL_APIGATEWAY=http://localhost:4566
export AWS_ENDPOINT_URL_CLOUDFORMATION=http://localhost:4566
export AWS_ENDPOINT_URL_SQS=http://localhost:4566
export AWS_ENDPOINT_URL_SNS=http://localhost:4566
export AWS_ENDPOINT_URL_DYNAMODB=http://localhost:4566

# Disable SSL verification for LocalStack
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo -e "${BLUE}🌐 Environment configured for LocalStack:${NC}"
echo -e "${YELLOW}  • AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL${NC}"
echo -e "${YELLOW}  • AWS_REGION: $AWS_REGION${NC}"
echo -e "${YELLOW}  • SSL Verification: Disabled${NC}"

# Run integration tests
echo -e "${YELLOW}🚀 Starting integration tests...${NC}"

# Use npm to run integration tests with proper environment
if npm run test:integration; then
    echo -e "${GREEN}🎉 Integration tests completed successfully!${NC}"

    # Show test summary
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo -e "${YELLOW}  • All infrastructure components validated${NC}"
    echo -e "${YELLOW}  • LocalStack environment verified${NC}"
    echo -e "${YELLOW}  • Resources properly configured${NC}"

    exit 0
else
    echo -e "${RED}❌ Integration tests failed!${NC}"

    # Provide troubleshooting tips
    echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
    echo -e "${BLUE}  1. Check LocalStack status: curl http://localhost:4566/_localstack/health${NC}"
    echo -e "${BLUE}  2. Verify infrastructure: npm run localstack:cfn:deploy${NC}"
    echo -e "${BLUE}  3. Check outputs file: cat $OUTPUTS_FILE${NC}"
    echo -e "${BLUE}  4. Review LocalStack logs: localstack logs${NC}"

    exit 1
fi
