#!/bin/bash

# LocalStack Restart Script
# Restarts LocalStack with Pro license support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting LocalStack...${NC}"

# Check if LocalStack CLI is installed
if ! command -v localstack &> /dev/null; then
    echo -e "${RED}❌ LocalStack CLI is not installed!${NC}"
    echo -e "${YELLOW}💡 Please install LocalStack CLI first:${NC}"
    echo -e "${BLUE}   pip install localstack${NC}"
    echo -e "${BLUE}   # or${NC}"
    echo -e "${BLUE}   brew install localstack/tap/localstack-cli${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack CLI found${NC}"

# Check for Pro license
if [ ! -z "$LOCALSTACK_AUTH_TOKEN" ] || [ ! -z "$LOCALSTACK_API_KEY" ]; then
    echo -e "${BLUE}🔑 Pro license detected${NC}"
    if [ ! -z "$LOCALSTACK_AUTH_TOKEN" ]; then
        echo -e "${GREEN}✅ Using LOCALSTACK_AUTH_TOKEN${NC}"
    elif [ ! -z "$LOCALSTACK_API_KEY" ]; then
        echo -e "${GREEN}✅ Using LOCALSTACK_API_KEY${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No Pro license found (using Community Edition)${NC}"
    echo -e "${BLUE}💡 To use Pro features, set one of:${NC}"
    echo -e "${BLUE}   export LOCALSTACK_AUTH_TOKEN=your_auth_token${NC}"
    echo -e "${BLUE}   export LOCALSTACK_API_KEY=your_api_key${NC}"
fi

# Stop LocalStack if running
if curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${YELLOW}🛑 Stopping current LocalStack instance...${NC}"
    localstack stop
    sleep 2
    echo -e "${GREEN}✅ LocalStack stopped${NC}"
else
    echo -e "${BLUE}ℹ️  LocalStack was not running${NC}"
fi

# Start LocalStack
echo -e "${YELLOW}🚀 Starting LocalStack...${NC}"

if [ ! -z "$LOCALSTACK_AUTH_TOKEN" ] || [ ! -z "$LOCALSTACK_API_KEY" ]; then
    echo -e "${BLUE}🚀 Starting LocalStack Pro...${NC}"
    localstack start -d
else
    echo -e "${BLUE}🚀 Starting LocalStack Community...${NC}"
    localstack start -d
fi

# Wait for LocalStack to be ready
echo -e "${YELLOW}⏳ Waiting for LocalStack to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:4566/_localstack/health > /dev/null; then
        echo -e "${GREEN}✅ LocalStack is ready!${NC}"
        
        # Show status
        echo -e "${BLUE}📊 LocalStack Status:${NC}"
        curl -s http://localhost:4566/_localstack/health | jq . 2>/dev/null || curl -s http://localhost:4566/_localstack/health
        
        # Show Pro status if applicable
        if [ ! -z "$LOCALSTACK_AUTH_TOKEN" ] || [ ! -z "$LOCALSTACK_API_KEY" ]; then
            echo -e "${BLUE}🏢 Pro Features Status:${NC}"
            curl -s http://localhost:4566/_localstack/info 2>/dev/null | jq '.edition // "Community"' || echo "Pro features available"
        fi
        
        echo -e "${GREEN}🎉 LocalStack restart completed!${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}⏳ Attempt $((attempt + 1))/$max_attempts - waiting...${NC}"
    sleep 2
    ((attempt++))
done

echo -e "${RED}❌ LocalStack failed to start or took too long to be ready${NC}"
echo -e "${YELLOW}💡 Check logs with: localstack logs${NC}"
exit 1