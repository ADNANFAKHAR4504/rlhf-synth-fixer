#!/bin/bash

# LocalStack Pulumi Deploy Script
# Deploys Pulumi infrastructure to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Pulumi to LocalStack...${NC}"

# Set LocalStack environment variables
export AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}
export AWS_REGION=${AWS_REGION:-us-east-1}

# Configure Pulumi to use LocalStack endpoints
export PULUMI_CONFIG_PASSPHRASE=${PULUMI_CONFIG_PASSPHRASE:-localstack}

echo -e "${GREEN}✅ LocalStack environment configured${NC}"
echo -e "${BLUE}   AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL${NC}"
echo -e "${BLUE}   AWS_REGION: $AWS_DEFAULT_REGION${NC}"

# Check if lib directory exists
if [ ! -d "lib" ]; then
    echo -e "${RED}❌ lib directory not found${NC}"
    exit 1
fi

cd lib

# Install dependencies based on language
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
    npm install
elif [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
elif [ -f "go.mod" ]; then
    echo -e "${YELLOW}📦 Installing Go dependencies...${NC}"
    go mod download
fi

# Login to local backend (use local file state for LocalStack)
echo -e "${YELLOW}🔐 Setting up Pulumi backend...${NC}"
pulumi login --local

# Select or create stack
STACK_NAME=${PULUMI_STACK_NAME:-localstack}
echo -e "${YELLOW}📚 Selecting stack: $STACK_NAME${NC}"
pulumi stack select $STACK_NAME || pulumi stack init $STACK_NAME

# Configure AWS endpoint for LocalStack
echo -e "${YELLOW}🔧 Configuring Pulumi for LocalStack...${NC}"
pulumi config set aws:region $AWS_DEFAULT_REGION
pulumi config set aws:accessKey $AWS_ACCESS_KEY_ID
pulumi config set aws:secretKey $AWS_SECRET_ACCESS_KEY
pulumi config set aws:skipCredentialsValidation true
pulumi config set aws:skipMetadataApiCheck true
pulumi config set aws:s3UsePathStyle true

# Set LocalStack endpoints for AWS services
pulumi config set aws:endpoints '[{"s3":"'$AWS_ENDPOINT_URL'","dynamodb":"'$AWS_ENDPOINT_URL'","lambda":"'$AWS_ENDPOINT_URL'","apigateway":"'$AWS_ENDPOINT_URL'","iam":"'$AWS_ENDPOINT_URL'","sts":"'$AWS_ENDPOINT_URL'","cloudformation":"'$AWS_ENDPOINT_URL'"}]'

# Deploy to LocalStack
echo -e "${YELLOW}🚀 Deploying to LocalStack...${NC}"
pulumi up --yes --skip-preview

echo -e "${GREEN}✅ Pulumi deployment to LocalStack completed!${NC}"
