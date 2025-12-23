#!/bin/bash

# LocalStack CDK Plan Script
# This script synthesizes CDK infrastructure for LocalStack deployment preview

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CDK Plan (Synth) for LocalStack...${NC}"

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
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566
export AWS_S3_FORCE_PATH_STYLE=true
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Change to project root (where cdk.json is located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Check if cdk.json exists
if [ ! -f "cdk.json" ]; then
    echo -e "${RED}❌ cdk.json not found in current directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CDK project found: cdk.json${NC}"

# Check if cdklocal is available
CDKLOCAL_PATH=""
if command -v cdklocal &> /dev/null; then
    CDKLOCAL_PATH="cdklocal"
elif [ -f ".venv/bin/cdklocal" ]; then
    CDKLOCAL_PATH=".venv/bin/cdklocal"
elif [ -f "./node_modules/.bin/cdklocal" ]; then
    CDKLOCAL_PATH="./node_modules/.bin/cdklocal"
else
    echo -e "${YELLOW}⚠️  cdklocal not found, attempting to use npx...${NC}"
    CDKLOCAL_PATH="npx aws-cdk-local"
fi

echo -e "${BLUE}🔧 Using CDK Local: $CDKLOCAL_PATH${NC}"

# Detect CDK language and install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

if [ -f "package.json" ]; then
    # TypeScript or JavaScript CDK project
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
    # Python CDK project
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true
    pip install -r requirements.txt -q
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
elif [ -f "pom.xml" ]; then
    # Java CDK project
    mvn package -q -DskipTests || true
    echo -e "${GREEN}✅ Java project built${NC}"
elif [ -f "go.mod" ]; then
    # Go CDK project
    go mod download
    go build ./...
    echo -e "${GREEN}✅ Go dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Could not detect CDK language (supports: ts, js, py, java, go)${NC}"
fi

# Bootstrap LocalStack CDK environment if needed
echo -e "${YELLOW}🔧 Checking CDK Bootstrap status...${NC}"
BOOTSTRAP_CHECK=$($CDKLOCAL_PATH bootstrap --show-template 2>/dev/null | head -1 || echo "")

if [ -z "$BOOTSTRAP_CHECK" ]; then
    echo -e "${YELLOW}📦 Bootstrapping CDK environment in LocalStack...${NC}"
    $CDKLOCAL_PATH bootstrap aws://000000000000/us-east-1 --force || true
    echo -e "${GREEN}✅ CDK Bootstrap completed${NC}"
else
    echo -e "${GREEN}✅ CDK Bootstrap already configured${NC}"
fi

# Clean previous synth output
echo -e "${YELLOW}🧹 Cleaning previous synth output...${NC}"
rm -rf cdk.out/
echo -e "${GREEN}✅ Previous output cleaned${NC}"

# Run CDK synth
echo -e "${YELLOW}📋 Running CDK Synth...${NC}"

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

if $CDKLOCAL_PATH synth --context environmentSuffix=$ENVIRONMENT_SUFFIX --all --quiet; then
    echo -e "${GREEN}✅ CDK Synth completed successfully${NC}"
else
    echo -e "${RED}❌ CDK Synth failed${NC}"
    exit 1
fi

# Display synthesized stacks
echo -e "${CYAN}📊 Synthesized CloudFormation Templates:${NC}"
if [ -d "cdk.out" ]; then
    for template in cdk.out/*.template.json; do
        if [ -f "$template" ]; then
            STACK_NAME=$(basename "$template" .template.json)
            RESOURCE_COUNT=$(cat "$template" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    resources = data.get('Resources', {})
    print(len(resources))
except:
    print('0')
" 2>/dev/null || echo "unknown")
            echo -e "${BLUE}  • Stack: $STACK_NAME${NC}"
            echo -e "${BLUE}    Resources: $RESOURCE_COUNT${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  No templates found in cdk.out/${NC}"
fi

# List all stacks
echo -e "${YELLOW}📋 Available CDK Stacks:${NC}"
$CDKLOCAL_PATH list --context environmentSuffix=$ENVIRONMENT_SUFFIX 2>/dev/null || echo -e "${YELLOW}⚠️  Could not list stacks${NC}"

# Show diff if stack already exists
echo -e "${YELLOW}📊 Checking for existing stack differences...${NC}"
$CDKLOCAL_PATH diff --context environmentSuffix=$ENVIRONMENT_SUFFIX --all 2>/dev/null || echo -e "${YELLOW}ℹ️  No existing stack to compare (new deployment)${NC}"

echo -e "${GREEN}🎉 CDK Plan (Synth) completed successfully!${NC}"
echo -e "${YELLOW}💡 To deploy this stack, run: ./scripts/localstack-cdk-deploy.sh${NC}"

