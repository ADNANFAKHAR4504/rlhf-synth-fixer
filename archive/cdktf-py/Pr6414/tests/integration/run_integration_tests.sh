#!/bin/bash
# Integration Test Runner for TAP Infrastructure
# Usage: ./run_integration_tests.sh [environment_suffix]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_SUFFIX="${1:-test-int}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TAP Infrastructure Integration Tests${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}ERROR: AWS credentials not configured${NC}"
    echo "Please configure AWS credentials:"
    echo "  export AWS_ACCESS_KEY_ID=your-key"
    echo "  export AWS_SECRET_ACCESS_KEY=your-secret"
    echo "  export AWS_REGION=us-east-1"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}
echo -e "${GREEN}✓ AWS Account: ${ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ Region: ${REGION}${NC}"
echo ""

# Set environment variables
export AWS_REGION="${REGION}"
export TEST_ENV_SUFFIX="${ENV_SUFFIX}"

echo -e "${YELLOW}Test Configuration:${NC}"
echo "  Environment Suffix: ${ENV_SUFFIX}"
echo "  AWS Region: ${REGION}"
echo ""

# Check if infrastructure is deployed
echo -e "${YELLOW}Checking infrastructure deployment...${NC}"

# Check for S3 bucket (quick validation)
if aws s3api head-bucket --bucket "tap-bucket-${ENV_SUFFIX}-tapstack" 2>/dev/null || \
   aws s3api head-bucket --bucket "tap-bucket-${ENV_SUFFIX}-tapstack${ENV_SUFFIX}" 2>/dev/null; then
    echo -e "${GREEN}✓ Infrastructure appears to be deployed${NC}"
else
    echo -e "${YELLOW}⚠ Infrastructure may not be deployed${NC}"
    echo "  Consider running: cd ${PROJECT_ROOT} && cdktf deploy"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Check Python dependencies
echo -e "${YELLOW}Checking test dependencies...${NC}"
cd "${PROJECT_ROOT}"

if ! python3 -c "import pytest" 2>/dev/null; then
    echo -e "${RED}ERROR: pytest not installed${NC}"
    echo "Install with: pip install -r tests/integration/requirements.txt"
    exit 1
fi

if ! python3 -c "import boto3" 2>/dev/null; then
    echo -e "${RED}ERROR: boto3 not installed${NC}"
    echo "Install with: pip install -r tests/integration/requirements.txt"
    exit 1
fi

echo -e "${GREEN}✓ Test dependencies installed${NC}"
echo ""

# Run integration tests
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Running Integration Tests${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Run with different verbosity based on environment
if [ "${CI}" = "true" ]; then
    # CI mode: less verbose, short traceback
    python3 -m pytest tests/integration/ \
        -v \
        --tb=short \
        --disable-warnings \
        -m integration
else
    # Local mode: verbose with full output
    python3 -m pytest tests/integration/ \
        -v \
        --tb=short \
        -m integration
fi

TEST_EXIT_CODE=$?

echo ""
echo -e "${GREEN}========================================${NC}"
if [ ${TEST_EXIT_CODE} -eq 0 ]; then
    echo -e "${GREEN}✓ All Integration Tests Passed!${NC}"
else
    echo -e "${RED}✗ Some Integration Tests Failed${NC}"
fi
echo -e "${GREEN}========================================${NC}"
echo ""

# Summary
echo -e "${YELLOW}Test Summary:${NC}"
echo "  Environment: ${ENV_SUFFIX}"
echo "  Region: ${REGION}"
echo "  Account: ${ACCOUNT_ID}"
echo ""

# Cleanup suggestion
if [ ${TEST_EXIT_CODE} -eq 0 ]; then
    echo -e "${YELLOW}To cleanup test resources:${NC}"
    echo "  cd ${PROJECT_ROOT}"
    echo "  cdktf destroy TapStack"
    echo ""
fi

exit ${TEST_EXIT_CODE}

