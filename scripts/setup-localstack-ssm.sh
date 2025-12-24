#!/bin/bash
#
# setup-localstack-ssm.sh
# Creates required SSM parameters for LocalStack CloudFormation deployment
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  LocalStack SSM Parameter Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Determine which AWS CLI to use
if command -v awslocal &> /dev/null; then
    AWS_CMD="awslocal"
    echo -e "${GREEN}✅ Using awslocal${NC}"
else
    AWS_CMD="aws"
    echo -e "${YELLOW}⚠️  Using standard aws CLI (ensure endpoint is configured)${NC}"
fi

# Set region
REGION="${AWS_REGION:-us-west-2}"
PARAMETER_NAME="/myapp/database/password"
PARAMETER_VALUE="TestPassword123!"

echo -e "${CYAN}🔧 Creating SSM parameter:${NC}"
echo -e "${BLUE}  • Name: ${PARAMETER_NAME}${NC}"
echo -e "${BLUE}  • Type: SecureString${NC}"
echo -e "${BLUE}  • Region: ${REGION}${NC}"
echo ""

# Create the SSM parameter
if $AWS_CMD ssm put-parameter \
    --name "$PARAMETER_NAME" \
    --value "$PARAMETER_VALUE" \
    --type "SecureString" \
    --description "Database password for LocalStack testing" \
    --overwrite \
    --region "$REGION" \
    --output json > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSM parameter created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Parameter may already exist or failed to create${NC}"

    # Try to verify it exists
    if $AWS_CMD ssm get-parameter \
        --name "$PARAMETER_NAME" \
        --region "$REGION" \
        --output json > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Parameter exists and is accessible${NC}"
    else
        echo -e "${RED}❌ Failed to create or verify SSM parameter${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSM Setup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
