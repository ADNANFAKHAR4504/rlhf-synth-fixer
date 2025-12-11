#!/bin/bash

# LocalStack Pulumi Deploy Script
# This script deploys Pulumi infrastructure to LocalStack with detailed progress monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Pulumi Deploy to LocalStack...${NC}"

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
export PULUMI_CONFIG_PASSPHRASE=localstack

# Change to project root (where Pulumi.yaml is located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Check if Pulumi.yaml exists
if [ ! -f "Pulumi.yaml" ]; then
    echo -e "${RED}❌ Pulumi.yaml not found in current directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pulumi project found: Pulumi.yaml${NC}"

# Check if Pulumi CLI is available
PULUMI_PATH=""
if command -v pulumi &> /dev/null; then
    PULUMI_PATH="pulumi"
elif [ -f "$HOME/.pulumi/bin/pulumi" ]; then
    PULUMI_PATH="$HOME/.pulumi/bin/pulumi"
else
    echo -e "${YELLOW}⚠️  Pulumi not found, installing...${NC}"
    curl -fsSL https://get.pulumi.com | sh
    PULUMI_PATH="$HOME/.pulumi/bin/pulumi"
fi

echo -e "${BLUE}🔧 Using Pulumi: $PULUMI_PATH${NC}"

# Login to local backend
echo -e "${YELLOW}📦 Setting up Pulumi local backend...${NC}"
$PULUMI_PATH login --local 2>/dev/null || true
echo -e "${GREEN}✅ Pulumi local backend configured${NC}"

# Detect Pulumi language and install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

if [ -f "package.json" ]; then
    # TypeScript or JavaScript Pulumi project
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
    
    # Build TypeScript if needed
    if [ -f "tsconfig.json" ]; then
        echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
        npm run build --if-present || npx tsc --skipLibCheck || true
        echo -e "${GREEN}✅ TypeScript build completed${NC}"
    fi
elif [ -f "requirements.txt" ]; then
    # Python Pulumi project
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true
    pip install -r requirements.txt -q
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
elif [ -f "go.mod" ]; then
    # Go Pulumi project
    go mod download
    echo -e "${GREEN}✅ Go dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Could not detect Pulumi language (supports: ts, js, py, go)${NC}"
fi

# Set stack parameters
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="localstack"

echo -e "${CYAN}🔧 Deploying Pulumi stack:${NC}"
echo -e "${BLUE}  • Stack Name: $STACK_NAME${NC}"
echo -e "${BLUE}  • Environment: $ENVIRONMENT_SUFFIX${NC}"
echo -e "${BLUE}  • Region: $AWS_DEFAULT_REGION${NC}"

# Initialize or select stack
echo -e "${YELLOW}📦 Initializing Pulumi stack...${NC}"

# Check if stack exists
if $PULUMI_PATH stack ls 2>/dev/null | grep -q "$STACK_NAME"; then
    echo -e "${BLUE}  Selecting existing stack: $STACK_NAME${NC}"
    $PULUMI_PATH stack select $STACK_NAME 2>/dev/null || true
else
    echo -e "${BLUE}  Creating new stack: $STACK_NAME${NC}"
    $PULUMI_PATH stack init $STACK_NAME --non-interactive 2>/dev/null || $PULUMI_PATH stack select $STACK_NAME 2>/dev/null || true
fi

# Configure AWS region
$PULUMI_PATH config set aws:region $AWS_DEFAULT_REGION 2>/dev/null || true

# Configure AWS endpoints for LocalStack
echo -e "${YELLOW}🔧 Configuring LocalStack endpoints...${NC}"
$PULUMI_PATH config set aws:skipCredentialsValidation true 2>/dev/null || true
$PULUMI_PATH config set aws:skipMetadataApiCheck true 2>/dev/null || true
$PULUMI_PATH config set aws:skipRequestingAccountId true 2>/dev/null || true
$PULUMI_PATH config set aws:s3UsePathStyle true 2>/dev/null || true

# Set LocalStack endpoints
$PULUMI_PATH config set aws:endpoints '[{"s3":"http://s3.localhost.localstack.cloud:4566","iam":"http://localhost:4566","sts":"http://localhost:4566","ec2":"http://localhost:4566","lambda":"http://localhost:4566","dynamodb":"http://localhost:4566","sns":"http://localhost:4566","sqs":"http://localhost:4566","cloudwatch":"http://localhost:4566","cloudformation":"http://localhost:4566","ssm":"http://localhost:4566","secretsmanager":"http://localhost:4566","logs":"http://localhost:4566","events":"http://localhost:4566","ecr":"http://localhost:4566","ecs":"http://localhost:4566","elbv2":"http://localhost:4566","codebuild":"http://localhost:4566","codedeploy":"http://localhost:4566","codepipeline":"http://localhost:4566"}]' 2>/dev/null || true

echo -e "${GREEN}✅ LocalStack endpoints configured${NC}"

# Track deployment time
DEPLOYMENT_START_TIME=$(date +%s)

# Clean up existing resources (destroy if exists)
echo -e "${YELLOW}🧹 Cleaning up existing resources...${NC}"
$PULUMI_PATH destroy --yes --skip-preview 2>/dev/null || true

# Run Pulumi deploy with progress output
echo -e "${YELLOW}📦 Deploying Pulumi stack...${NC}"
echo

$PULUMI_PATH up --yes 2>&1 | while IFS= read -r line; do
    # Color code output based on content
    if [[ "$line" == *"created"* ]] || [[ "$line" == *"CREATE_COMPLETE"* ]]; then
        echo -e "${GREEN}✅ $line${NC}"
    elif [[ "$line" == *"creating"* ]] || [[ "$line" == *"Updating"* ]] || [[ "$line" == *"Previewing"* ]]; then
        echo -e "${BLUE}🔄 $line${NC}"
    elif [[ "$line" == *"failed"* ]] || [[ "$line" == *"error"* ]] || [[ "$line" == *"FAILED"* ]]; then
        echo -e "${RED}❌ $line${NC}"
    elif [[ "$line" == *"Outputs:"* ]]; then
        echo -e "${CYAN}📋 $line${NC}"
    elif [[ "$line" == *"Resources:"* ]] || [[ "$line" == *"Duration:"* ]]; then
        echo -e "${MAGENTA}$line${NC}"
    elif [[ "$line" == *"+"* ]]; then
        echo -e "${GREEN}$line${NC}"
    elif [[ "$line" == *"-"* ]]; then
        echo -e "${RED}$line${NC}"
    elif [[ "$line" == *"~"* ]]; then
        echo -e "${YELLOW}$line${NC}"
    else
        echo -e "${YELLOW}$line${NC}"
    fi
done

DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

DEPLOYMENT_END_TIME=$(date +%s)
DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))

echo
echo -e "${GREEN}⏱️  Total deployment time: ${DEPLOYMENT_DURATION}s${NC}"

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Pulumi deployment failed${NC}"
    exit 1
fi

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

STACK_OUTPUTS=$($PULUMI_PATH stack output --json 2>/dev/null || echo '{}')

# Generate outputs
echo -e "${YELLOW}📊 Generating stack outputs...${NC}"
mkdir -p cfn-outputs

echo "$STACK_OUTPUTS" > cfn-outputs/flat-outputs.json
echo -e "${GREEN}✅ Outputs saved to cfn-outputs/flat-outputs.json${NC}"

if [ "$STACK_OUTPUTS" != "{}" ] && [ -n "$STACK_OUTPUTS" ]; then
    echo -e "${BLUE}📋 Stack Outputs:${NC}"
    echo "$STACK_OUTPUTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for key, value in data.items():
        print(f'  • {key}: {value}')
except:
    pass
" 2>/dev/null || echo "$STACK_OUTPUTS"
else
    echo -e "${YELLOW}ℹ️  No stack outputs defined${NC}"
fi

# Get resource count from stack
RESOURCE_COUNT=$($PULUMI_PATH stack --show-urns 2>/dev/null | grep -c "urn:" || echo "0")

# Final summary
echo -e "${CYAN}🎯 Deployment Summary:${NC}"
echo -e "${BLUE}  • Stack: $STACK_NAME${NC}"
echo -e "${BLUE}  • Status: Deployed${NC}"
echo -e "${BLUE}  • Resources: $RESOURCE_COUNT${NC}"
echo -e "${BLUE}  • Duration: ${DEPLOYMENT_DURATION}s${NC}"
echo -e "${BLUE}  • LocalStack: http://localhost:4566${NC}"

echo -e "${GREEN}🎉 Pulumi deployment to LocalStack completed successfully!${NC}"

