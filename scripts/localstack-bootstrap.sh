#!/bin/bash

# LocalStack Bootstrap Script (ECR-free)
# Creates only S3 bucket for CDK assets (no ECR)
# This avoids LocalStack Pro requirement for ECR

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 LocalStack Bootstrap (ECR-free)${NC}"
echo ""

# Configuration
ACCOUNT_ID="${CDK_DEFAULT_ACCOUNT:-000000000000}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
BUCKET_NAME="cdk-hnb659fds-assets-${ACCOUNT_ID}-${REGION}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Account: $ACCOUNT_ID"
echo "   Region: $REGION"
echo "   Bucket: $BUCKET_NAME"
echo ""

# Check LocalStack
echo -e "${YELLOW}🔍 Checking LocalStack...${NC}"
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${RED}❌ LocalStack is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ LocalStack is running${NC}"
echo ""

# Configure AWS CLI for LocalStack
export AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

# Create S3 bucket for CDK assets
echo -e "${YELLOW}📦 Creating CDK assets bucket...${NC}"

if aws s3 ls "s3://${BUCKET_NAME}" 2>/dev/null; then
    echo -e "${GREEN}✅ Bucket already exists: ${BUCKET_NAME}${NC}"
else
    if aws s3 mb "s3://${BUCKET_NAME}" 2>/dev/null; then
        echo -e "${GREEN}✅ Created bucket: ${BUCKET_NAME}${NC}"
    else
        echo -e "${RED}❌ Failed to create bucket${NC}"
        exit 1
    fi
fi

# Enable versioning (optional but recommended)
echo -e "${YELLOW}🔧 Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled 2>/dev/null || echo "Versioning skipped"

# Create IAM roles (LocalStack is lenient but CDK expects them)
echo -e "${YELLOW}🔐 Creating IAM roles...${NC}"

# Create LocalStack execution role
aws iam create-role \
    --role-name LocalStackExecutionRole \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"cloudformation.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    2>/dev/null && echo -e "${GREEN}✅ Created LocalStackExecutionRole${NC}" || echo "   Role already exists or creation skipped"

aws iam attach-role-policy \
    --role-name LocalStackExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \
    2>/dev/null || true

# Create LocalStack deploy role
aws iam create-role \
    --role-name LocalStackDeployRole \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"cloudformation.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    2>/dev/null && echo -e "${GREEN}✅ Created LocalStackDeployRole${NC}" || echo "   Role already exists or creation skipped"

aws iam attach-role-policy \
    --role-name LocalStackDeployRole \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \
    2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Bootstrap complete!${NC}"
echo -e "${GREEN}   Assets bucket: s3://${BUCKET_NAME}${NC}"
echo -e "${GREEN}   IAM roles: LocalStackExecutionRole, LocalStackDeployRole${NC}"
echo ""
