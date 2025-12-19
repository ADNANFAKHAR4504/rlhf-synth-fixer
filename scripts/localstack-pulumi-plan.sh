#!/bin/bash

# LocalStack Pulumi Plan Script
# This script previews Pulumi infrastructure changes for LocalStack deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Pulumi Plan (Preview) for LocalStack...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Pulumi AWS provider configuration for LocalStack
export PULUMI_CONFIG_PASSPHRASE=""
export AWS_SKIP_CREDENTIALS_VALIDATION=true
export AWS_SKIP_METADATA_API_CHECK=true
export AWS_SKIP_REQUESTING_ACCOUNT_ID=true

# Change to project root (where Pulumi.yaml is located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Check if Pulumi.yaml exists
if [ ! -f "Pulumi.yaml" ]; then
    echo -e "${RED}❌ Pulumi.yaml not found in current directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pulumi project found: Pulumi.yaml${NC}"

# Check if pulumi is available
if ! command -v pulumi &> /dev/null; then
    echo -e "${RED}❌ Pulumi CLI not found. Please install Pulumi first.${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 Using Pulumi: $(pulumi version)${NC}"

# Set up local backend FIRST before any other pulumi commands
echo -e "${YELLOW}🔧 Setting up Pulumi local backend...${NC}"
mkdir -p .pulumi-state
pulumi login --local >/dev/null 2>&1 || true
echo -e "${GREEN}✅ Pulumi local backend configured${NC}"

# Detect Pulumi runtime from Pulumi.yaml
PULUMI_RUNTIME=""
if [ -f "Pulumi.yaml" ]; then
    # Handle both formats: "runtime: python" and "runtime:\n  name: python"
    PULUMI_RUNTIME=$(grep -A 1 "^runtime:" Pulumi.yaml 2>/dev/null | grep -E "^\s+name:" | awk '{print $2}' | tr -d '"' | tr -d "'" | head -1)
    # Fallback to single-line format
    if [ -z "$PULUMI_RUNTIME" ]; then
        PULUMI_RUNTIME=$(grep -E "^runtime:" Pulumi.yaml 2>/dev/null | awk '{print $2}' | tr -d '"' | tr -d "'")
    fi
fi
echo -e "${BLUE}📋 Pulumi runtime: ${PULUMI_RUNTIME:-unknown}${NC}"

# Install dependencies based on Pulumi runtime
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

case "$PULUMI_RUNTIME" in
    nodejs)
        if [ -f "package.json" ]; then
            if [ ! -d "node_modules" ]; then
                npm install
            fi
            echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
            
            # Build TypeScript if needed
            if [ -f "tsconfig.json" ]; then
                echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
                npm run build --if-present || npx tsc || true
                echo -e "${GREEN}✅ TypeScript build completed${NC}"
            fi
        fi
        ;;
    python)
        if [ ! -d ".venv" ]; then
            python -m venv .venv
        fi
        # Activate venv (cross-platform)
        source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt -q
        fi
        # Set PYTHONPATH to enable local imports without editable install
        export PYTHONPATH="$(pwd):$PYTHONPATH"
        # Ensure Pulumi AWS provider is installed (required for Pulumi Python projects)
        if ! python -c "import pulumi_aws" 2>/dev/null; then
            pip install pulumi-aws -q
        fi
        # Ensure pulumi is installed
        if ! python -c "import pulumi" 2>/dev/null; then
            pip install pulumi -q
        fi
        # Tell Pulumi to use the venv's Python
        export PULUMI_PYTHON_CMD="python"
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
        ;;
    java)
        if [ -f "pom.xml" ]; then
            mvn package -q -DskipTests || true
            echo -e "${GREEN}✅ Java project built${NC}"
        fi
        ;;
    go)
        if [ -f "go.mod" ]; then
            go mod download
            echo -e "${GREEN}✅ Go dependencies installed${NC}"
        fi
        ;;
    *)
        echo -e "${YELLOW}⚠️  Unknown Pulumi runtime: ${PULUMI_RUNTIME:-not specified}${NC}"
        ;;
esac

# Set stack name
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="localstack-${ENVIRONMENT_SUFFIX}"

# Check if stack exists, create if not
echo -e "${YELLOW}🔧 Checking Pulumi stack...${NC}"
if ! pulumi stack select $STACK_NAME 2>/dev/null; then
    echo -e "${YELLOW}📦 Creating new stack: $STACK_NAME${NC}"
    pulumi stack init $STACK_NAME 2>/dev/null || true
    pulumi stack select $STACK_NAME
fi
echo -e "${GREEN}✅ Stack selected: $STACK_NAME${NC}"

# Configure AWS provider for LocalStack
echo -e "${YELLOW}🔧 Configuring AWS provider for LocalStack...${NC}"
pulumi config set aws:region us-east-1 2>/dev/null || true
pulumi config set aws:accessKey test 2>/dev/null || true
pulumi config set aws:secretKey test --secret 2>/dev/null || true
pulumi config set aws:skipCredentialsValidation true 2>/dev/null || true
pulumi config set aws:skipMetadataApiCheck true 2>/dev/null || true
pulumi config set aws:skipRequestingAccountId true 2>/dev/null || true
pulumi config set aws:s3UsePathStyle true 2>/dev/null || true

# Set LocalStack endpoints
pulumi config set aws:endpoints '[{"s3":"http://localhost:4566","lambda":"http://localhost:4566","dynamodb":"http://localhost:4566","sqs":"http://localhost:4566","sns":"http://localhost:4566","iam":"http://localhost:4566","cloudformation":"http://localhost:4566","cloudwatch":"http://localhost:4566","ec2":"http://localhost:4566","rds":"http://localhost:4566","secretsmanager":"http://localhost:4566","ssm":"http://localhost:4566","sts":"http://localhost:4566","apigateway":"http://localhost:4566"}]' 2>/dev/null || true

echo -e "${GREEN}✅ AWS provider configured for LocalStack${NC}"

# Run Pulumi preview
echo -e "${YELLOW}📋 Running Pulumi Preview...${NC}"

if pulumi preview --diff; then
    echo -e "${GREEN}✅ Pulumi Preview completed successfully${NC}"
else
    echo -e "${RED}❌ Pulumi Preview failed${NC}"
    exit 1
fi

# Show stack info
echo -e "${CYAN}📊 Stack Information:${NC}"
echo -e "${BLUE}  • Stack: $STACK_NAME${NC}"
echo -e "${BLUE}  • Region: $AWS_DEFAULT_REGION${NC}"
echo -e "${BLUE}  • LocalStack: http://localhost:4566${NC}"

echo -e "${GREEN}🎉 Pulumi Plan (Preview) completed successfully!${NC}"
echo -e "${YELLOW}💡 To deploy this stack, run: ./scripts/localstack-pulumi-deploy.sh${NC}"

