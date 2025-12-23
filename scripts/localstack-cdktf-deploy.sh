#!/bin/bash

# LocalStack CDKTF Deploy Script
# Deploys CDKTF infrastructure to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying CDKTF to LocalStack...${NC}"

# Set LocalStack environment variables
export AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo -e "${GREEN}✅ LocalStack environment configured${NC}"
echo -e "${BLUE}   AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL${NC}"
echo -e "${BLUE}   AWS_REGION: $AWS_DEFAULT_REGION${NC}"

# Check if lib directory exists
if [ ! -d "lib" ]; then
    echo -e "${RED}❌ lib directory not found${NC}"
    exit 1
fi

cd lib

# Install dependencies if needed
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
    npm install
fi

# Synthesize CDKTF
echo -e "${YELLOW}🔧 Synthesizing CDKTF...${NC}"
cdktf synth

# Deploy to LocalStack
echo -e "${YELLOW}🚀 Deploying to LocalStack...${NC}"
cdktf deploy --auto-approve

echo -e "${GREEN}✅ CDKTF deployment to LocalStack completed!${NC}"
