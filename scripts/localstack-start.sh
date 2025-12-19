#!/bin/bash

# LocalStack Start Script
# Starts LocalStack with Pro license support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting LocalStack...${NC}"

# Check if LocalStack CLI is installed
if ! command -v localstack &> /dev/null; then
    echo -e "${RED}❌ LocalStack CLI is not installed!${NC}"
    echo -e "${YELLOW}💡 Please install LocalStack CLI first:${NC}"
    echo -e "${BLUE}   pip install localstack${NC}"
    echo -e "${BLUE}   # or${NC}"
    echo -e "${BLUE}   brew install localstack/tap/localstack-cli${NC}"
    echo -e "${BLUE}   # or${NC}"
    echo -e "${BLUE}   curl -Lo localstack-cli-3.7.2-linux-amd64-onefile.tar.gz https://github.com/localstack/localstack-cli/releases/download/v3.7.2/localstack-cli-3.7.2-linux-amd64-onefile.tar.gz${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack CLI found${NC}"

# Check if LocalStack is already running
if curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${YELLOW}⚠️  LocalStack is already running!${NC}"
    echo -e "${BLUE}💡 Current status:${NC}"
    curl -s http://localhost:4566/_localstack/health | jq . 2>/dev/null || curl -s http://localhost:4566/_localstack/health
    exit 0
fi

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

# Start LocalStack
echo -e "${YELLOW}🔧 Starting LocalStack container...${NC}"

# Use localstack start command with Pro license support
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
        
        exit 0
    fi
    
    echo -e "${YELLOW}⏳ Attempt $((attempt + 1))/$max_attempts - waiting...${NC}"
    sleep 2
    ((attempt++))
done

echo -e "${RED}❌ LocalStack failed to start or took too long to be ready${NC}"
echo -e "${YELLOW}💡 Check logs with: localstack logs${NC}"
exit 1