#!/bin/bash

# LocalStack Start Script for CI/CD
# Starts LocalStack using Docker for CI environments (GitHub Actions, etc.)

set -eo pipefail

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

# LocalStack Pro 4.12+ requires explicit service configuration
# Enable core services needed for CDK/CloudFormation deployments
if [ -n "$LOCALSTACK_SERVICES" ]; then
    SERVICES="$LOCALSTACK_SERVICES"
    echo -e "${BLUE}📋 Services to enable: ${SERVICES}${NC}"
else
    # Default services for CDK/CFN/Terraform/Pulumi deployments
    # Include all commonly needed services to avoid "service not enabled" errors
    # Note: elasticloadbalancing is separate from elb and elbv2 in LocalStack
    # RDS is included for database workloads (requires LocalStack Pro)
    SERVICES="acm,apigateway,cloudformation,cloudwatch,dynamodb,ec2,ecr,ecs,elb,elbv2,events,iam,kms,lambda,logs,route53,rds,s3,secretsmanager,sns,sqs,ssm,sts,autoscaling"
    echo -e "${BLUE}📋 Services to enable: ${SERVICES}${NC}"
    echo -e "${YELLOW}💡 To customize, set LOCALSTACK_SERVICES environment variable${NC}"
fi

# Check for LocalStack API Key
if [ -n "$LOCALSTACK_API_KEY" ]; then
    echo -e "${GREEN}✅ LocalStack API Key detected (Pro features enabled)${NC}"
else
    echo -e "${YELLOW}⚠️  No LocalStack API Key found (using Community Edition)${NC}"
    echo -e "${BLUE}💡 To enable Pro features, set LOCALSTACK_API_KEY in GitHub Secrets${NC}"
fi

# Start LocalStack container
echo -e "${YELLOW}🔧 Starting LocalStack container...${NC}"

# Build docker run command
# Using LocalStack Pro image with latest version for full AWS service parity
# CI-optimized settings for GitHub Actions
DOCKER_CMD="docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e DEBUG=1 \
  -e DATA_DIR=/tmp/localstack/data \
  -e S3_SKIP_SIGNATURE_VALIDATION=1 \
  -e ENFORCE_IAM=0 \
  -e RDS_MYSQL_DOCKER=0 \
  -e RDS_PG_DOCKER=0 \
  -e LAMBDA_EXECUTOR=local \
  -e LAMBDA_REMOVE_CONTAINERS=1 \
  -e CFN_PER_RESOURCE_TIMEOUT=600 \
  -e CFN_MAX_RESOURCE_RETRIES=30 \
  -e EC2_EBS_MAX_VOLUME_SIZE=500 \
  -e EC2_DOWNLOAD_DEFAULT_IMAGES=0 \
  -e DISABLE_CORS_CHECKS=1 \
  -e SKIP_INFRA_DOWNLOADS=1"

# Add API key if available (required for Pro features)
if [ -n "$LOCALSTACK_API_KEY" ]; then
    DOCKER_CMD="$DOCKER_CMD \
  -e LOCALSTACK_API_KEY=\"${LOCALSTACK_API_KEY}\""
fi

DOCKER_CMD="$DOCKER_CMD \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp/localstack:/var/lib/localstack \
  localstack/localstack-pro:stable"

# Execute the docker command
eval $DOCKER_CMD

echo -e "${GREEN}✅ LocalStack container started${NC}"

# Wait for LocalStack to be ready
echo -e "${YELLOW}⏳ Waiting for LocalStack to be ready...${NC}"
max_attempts=60
attempt=0

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed!${NC}"
    echo -e "${YELLOW}💡 Installing curl...${NC}"
    # In GitHub Actions Ubuntu, curl should be pre-installed, but just in case
    sudo apt-get update && sudo apt-get install -y curl || true
fi

# Give LocalStack more time to start before checking (Pro image needs more initialization time)
echo -e "${BLUE}⏱️  Waiting 60 seconds for LocalStack to initialize...${NC}"
sleep 60

while [ $attempt -lt $max_attempts ]; do
    # Show logs on first attempt to debug CI issues immediately
    if [ $attempt -eq 0 ]; then
        echo -e "${BLUE}📋 LocalStack startup logs:${NC}"
        docker logs localstack 2>&1 | tail -30
        echo ""
    fi

    # Check container is still running
    if ! docker ps | grep -q localstack; then
        echo -e "${RED}❌ LocalStack container stopped unexpectedly!${NC}"
        echo -e "${YELLOW}💡 Full container logs:${NC}"
        docker logs localstack 2>&1
        echo ""
        echo -e "${YELLOW}💡 Container exit status:${NC}"
        docker inspect localstack --format='{{.State.ExitCode}}' 2>/dev/null || echo "Cannot get exit code"
        exit 1
    fi

    # Try to connect to LocalStack health endpoint with verbose output on first few attempts
    if [ $attempt -lt 3 ]; then
        echo -e "${BLUE}🔍 Testing connectivity to localhost:4566 (attempt $((attempt + 1)))...${NC}"
        curl -4 -v --connect-timeout 5 --max-time 10 http://localhost:4566/_localstack/health 2>&1 | head -30 || echo "Connection failed, will retry..."
    fi
    
    # Show container logs every 10 attempts to help debug startup issues
    if [ $((attempt % 10)) -eq 0 ] && [ $attempt -gt 0 ]; then
        echo -e "${BLUE}📋 Container logs (last 20 lines):${NC}"
        docker logs localstack 2>&1 | tail -20
    fi

    # Regular health check (suppress output for cleaner logs) - force IPv4
    HTTP_CODE=$(curl -4 --connect-timeout 5 --max-time 10 -s -o /dev/null -w "%{http_code}" http://localhost:4566/_localstack/health 2>&1 || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
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

    echo -e "${YELLOW}⏳ Attempt $((attempt + 1))/$max_attempts - waiting for LocalStack (HTTP $HTTP_CODE)...${NC}"
    sleep 3
    ((attempt++))
done

# If we reach here, LocalStack failed to start
echo ""
echo -e "${RED}❌ LocalStack failed to start or took too long to be ready${NC}"
echo -e "${YELLOW}💡 Debugging information:${NC}"
echo ""

echo -e "${BLUE}📊 Container status:${NC}"
docker ps -a | grep localstack || echo "No LocalStack container found"
echo ""

echo -e "${BLUE}📋 Container logs (last 100 lines):${NC}"
docker logs localstack 2>&1 | tail -100 || echo "Could not retrieve logs"
echo ""

echo -e "${BLUE}🔍 Network connectivity test:${NC}"
echo "Testing connection to localhost:4566..."
nc -zv localhost 4566 2>&1 || echo "Port 4566 is not accessible"
echo ""

echo -e "${BLUE}🐳 Docker network inspection:${NC}"
docker inspect localstack --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>&1 || echo "Could not inspect container"
echo ""

exit 1
