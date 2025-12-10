#!/bin/bash

# LocalStack Start Script for CI/CD
# Starts LocalStack using Docker for CI environments (GitHub Actions, etc.)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                         🚀 Starting LocalStack for CI/CD                                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo -e "${YELLOW}💡 Please install Docker first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Check if LocalStack container is already running
if docker ps | grep -q localstack; then
    echo -e "${YELLOW}⚠️  LocalStack container is already running!${NC}"
    echo -e "${BLUE}💡 Current status:${NC}"

    # Show container status
    docker ps | grep localstack

    # Check health
    if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ LocalStack is healthy${NC}"
        curl -s http://localhost:4566/_localstack/health 2>/dev/null || echo "Health check passed"
    else
        echo -e "${YELLOW}⚠️  LocalStack container is running but not responding. Restarting...${NC}"
        docker stop localstack 2>/dev/null || true
        docker rm localstack 2>/dev/null || true
    fi

    # If already running and healthy, exit successfully
    if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        exit 0
    fi
fi

# Remove any existing stopped LocalStack container
if docker ps -a | grep -q localstack; then
    echo -e "${YELLOW}🧹 Removing existing LocalStack container...${NC}"
    docker stop localstack 2>/dev/null || true
    docker rm localstack 2>/dev/null || true
fi

# Determine which services to enable
SERVICES="${LOCALSTACK_SERVICES:-s3,lambda,dynamodb,cloudformation,apigateway,sts,iam,cloudwatch,logs,events,sns,sqs,kinesis,ec2,rds,ecs,ecr}"

echo -e "${BLUE}📋 Services to enable: ${SERVICES}${NC}"

# Check for LocalStack API Key
if [ -n "$LOCALSTACK_API_KEY" ]; then
    echo -e "${GREEN}✅ LocalStack API Key detected (Pro features enabled)${NC}"
else
    echo -e "${YELLOW}⚠️  No LocalStack API Key found (using Community Edition)${NC}"
    echo -e "${BLUE}💡 To enable Pro features, set LOCALSTACK_API_KEY in GitHub Secrets${NC}"
fi

# Start LocalStack container
echo -e "${YELLOW}🔧 Starting LocalStack container...${NC}"

# Build docker run command with optional API key
DOCKER_CMD="docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=\"${SERVICES}\" \
  -e DEBUG=1 \
  -e DATA_DIR=/tmp/localstack/data \
  -e DOCKER_HOST=unix:///var/run/docker.sock"

# Add API key if available
if [ -n "$LOCALSTACK_API_KEY" ]; then
    DOCKER_CMD="$DOCKER_CMD \
  -e LOCALSTACK_API_KEY=\"${LOCALSTACK_API_KEY}\""
fi

DOCKER_CMD="$DOCKER_CMD \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack:latest"

# Execute the docker command
eval $DOCKER_CMD

echo -e "${GREEN}✅ LocalStack container started${NC}"

# Wait for LocalStack to be ready
echo -e "${YELLOW}⏳ Waiting for LocalStack to be ready...${NC}"
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ LocalStack is ready!${NC}"
        echo ""

        # Show status
        echo -e "${BLUE}📊 LocalStack Health Status:${NC}"
        curl -s http://localhost:4566/_localstack/health 2>/dev/null | jq . 2>/dev/null || curl -s http://localhost:4566/_localstack/health
        echo ""

        # Show container info
        echo -e "${BLUE}🐳 Container Information:${NC}"
        docker ps | grep localstack
        echo ""

        echo -e "${GREEN}🎉 LocalStack is fully operational!${NC}"
        exit 0
    fi

    echo -e "${YELLOW}⏳ Attempt $((attempt + 1))/$max_attempts - waiting for LocalStack...${NC}"
    sleep 2
    ((attempt++))
done

# If we reach here, LocalStack failed to start
echo ""
echo -e "${RED}❌ LocalStack failed to start or took too long to be ready${NC}"
echo -e "${YELLOW}💡 Container logs:${NC}"
docker logs localstack 2>&1 | tail -50

echo ""
echo -e "${YELLOW}💡 Container status:${NC}"
docker ps -a | grep localstack

exit 1
