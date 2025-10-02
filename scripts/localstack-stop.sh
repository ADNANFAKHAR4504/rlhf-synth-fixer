#!/bin/bash

# LocalStack Stop Script
# Stops LocalStack and optionally saves state

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 Stopping LocalStack...${NC}"

# Check if LocalStack CLI is installed
if ! command -v localstack &> /dev/null; then
    echo -e "${RED}❌ LocalStack CLI is not installed!${NC}"
    echo -e "${YELLOW}💡 Please install LocalStack CLI first:${NC}"
    echo -e "${BLUE}   pip install localstack${NC}"
    echo -e "${BLUE}   # or${NC}"
    echo -e "${BLUE}   brew install localstack/tap/localstack-cli${NC}"
    exit 1
fi

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${YELLOW}⚠️  LocalStack is not running${NC}"
    exit 0
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Stopping LocalStack without state saving

# Stop LocalStack
echo -e "${YELLOW}🔧 Stopping LocalStack container...${NC}"
localstack stop

# Verify it's stopped
sleep 2
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ LocalStack stopped successfully${NC}"
else
    echo -e "${RED}❌ LocalStack may still be running${NC}"
    echo -e "${YELLOW}💡 Try: docker stop localstack_main${NC}"
fi