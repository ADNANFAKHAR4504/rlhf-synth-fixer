#!/bin/bash

# LocalStack CDK Deploy Script
# This script deploys CDK infrastructure to LocalStack with detailed progress monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CDK Deploy to LocalStack...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Clean LocalStack before deployment
echo -e "${YELLOW}🧹 Cleaning LocalStack resources...${NC}"

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566
export AWS_S3_FORCE_PATH_STYLE=true
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Clean existing CDK stacks
STACKS=$(awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE CREATE_FAILED UPDATE_ROLLBACK_COMPLETE --query 'StackSummaries[?contains(StackName, `Tap`) || contains(StackName, `CDK`)].StackName' --output text 2>/dev/null || echo '')
if [ ! -z "$STACKS" ]; then
    for stack in $STACKS; do
        echo -e "${BLUE}  🗑️  Deleting existing CDK stack: $stack${NC}"
        awslocal cloudformation delete-stack --stack-name $stack 2>/dev/null || true
    done
    sleep 3
fi

# Reset LocalStack state
curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null && echo -e "${GREEN}✅ LocalStack state reset${NC}" || echo -e "${YELLOW}⚠️  State reset not available${NC}"

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

# Bootstrap LocalStack CDK environment
echo -e "${YELLOW}📦 Bootstrapping CDK environment in LocalStack...${NC}"

# Clean up existing bootstrap resources to avoid conflicts
echo -e "${BLUE}  🧹 Cleaning existing CDK bootstrap resources...${NC}"

# Delete existing CDKToolkit stack if it exists
awslocal cloudformation delete-stack --stack-name CDKToolkit 2>/dev/null || true
sleep 2

# Delete existing ECR repository if it exists (common bootstrap conflict)
awslocal ecr delete-repository \
    --repository-name cdk-hnb659fds-container-assets-000000000000-us-east-1 \
    --force 2>/dev/null || true

# Delete S3 buckets used by CDK bootstrap
awslocal s3 rb s3://cdk-hnb659fds-assets-000000000000-us-east-1 --force 2>/dev/null || true

echo -e "${GREEN}✅ Bootstrap resources cleaned${NC}"

# Run bootstrap with proper error handling
BOOTSTRAP_OUTPUT=$($CDKLOCAL_PATH bootstrap aws://000000000000/us-east-1 --force 2>&1)
BOOTSTRAP_EXIT_CODE=$?

if [ $BOOTSTRAP_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Bootstrap warning (non-fatal):${NC}"
    echo "$BOOTSTRAP_OUTPUT" | grep -i "error\|warn\|exception" | head -5 || true

    # Check if bootstrap stack actually exists despite error
    if awslocal cloudformation describe-stacks --stack-name CDKToolkit 2>/dev/null | grep -q "StackStatus"; then
        echo -e "${GREEN}✅ CDK Bootstrap stack exists (ignoring warning)${NC}"
    else
        echo -e "${RED}❌ CDK Bootstrap failed${NC}"
        echo "$BOOTSTRAP_OUTPUT"
        exit 1
    fi
else
    echo -e "${GREEN}✅ CDK Bootstrap completed${NC}"
fi

# Set stack parameters
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

echo -e "${CYAN}🔧 Deploying CDK stack:${NC}"
echo -e "${BLUE}  • Stack Name: $STACK_NAME${NC}"
echo -e "${BLUE}  • Environment: $ENVIRONMENT_SUFFIX${NC}"
echo -e "${BLUE}  • Region: $AWS_DEFAULT_REGION${NC}"

# Track deployment time
DEPLOYMENT_START_TIME=$(date +%s)

# Run CDK deploy with progress output
echo -e "${YELLOW}📦 Deploying CDK stack...${NC}"

$CDKLOCAL_PATH deploy \
    --context environmentSuffix=$ENVIRONMENT_SUFFIX \
    --all \
    --require-approval never \
    --progress events \
    2>&1 | while IFS= read -r line; do
        # Color code output based on content
        if [[ "$line" == *"CREATE_COMPLETE"* ]] || [[ "$line" == *"UPDATE_COMPLETE"* ]]; then
            echo -e "${GREEN}✅ $line${NC}"
        elif [[ "$line" == *"CREATE_IN_PROGRESS"* ]] || [[ "$line" == *"UPDATE_IN_PROGRESS"* ]]; then
            echo -e "${BLUE}🔄 $line${NC}"
        elif [[ "$line" == *"FAILED"* ]] || [[ "$line" == *"ROLLBACK"* ]]; then
            echo -e "${RED}❌ $line${NC}"
        elif [[ "$line" == *"Outputs:"* ]]; then
            echo -e "${CYAN}📋 $line${NC}"
        else
            echo -e "${YELLOW}$line${NC}"
        fi
    done

DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ CDK deployment failed${NC}"
    
    # Show failure details
    echo -e "${YELLOW}📋 Checking stack events for errors...${NC}"
    awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
        --query 'StackEvents[?contains(ResourceStatus,`FAILED`)].[Timestamp,LogicalResourceId,ResourceType,ResourceStatusReason]' \
        --output table --max-items 10 2>/dev/null || true
    exit 1
fi

DEPLOYMENT_END_TIME=$(date +%s)
DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))

echo -e "${GREEN}⏱️  Total deployment time: ${DEPLOYMENT_DURATION}s${NC}"

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")

if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]] || [[ "$STACK_STATUS" == "UPDATE_COMPLETE" ]]; then
    echo -e "${GREEN}✅ Stack status: $STACK_STATUS${NC}"
else
    echo -e "${YELLOW}⚠️  Stack status: $STACK_STATUS${NC}"
fi

# Final resource summary
echo -e "${CYAN}📊 Final Resource Summary:${NC}"
awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
    --query 'StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`].[LogicalResourceId,ResourceType,ResourceStatus]' \
    --output table 2>/dev/null || echo -e "${YELLOW}⚠️  Could not retrieve resource summary${NC}"

TOTAL_RESOURCES=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
    --query 'length(StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`])' --output text 2>/dev/null || echo "0")

echo -e "${GREEN}✅ Successfully deployed resources: $TOTAL_RESOURCES${NC}"

# Generate outputs
echo -e "${YELLOW}📊 Generating stack outputs...${NC}"
mkdir -p cfn-outputs

# Get stack outputs
STACK_INFO=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME 2>/dev/null || echo '{"Stacks":[]}')
OUTPUT_JSON=$(echo "$STACK_INFO" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    outputs = {}
    if 'Stacks' in data and len(data['Stacks']) > 0:
        stack_outputs = data['Stacks'][0].get('Outputs', [])
        for output in stack_outputs:
            outputs[output['OutputKey']] = output['OutputValue']
    print(json.dumps(outputs, indent=2))
except:
    print('{}')
")

echo "$OUTPUT_JSON" > cfn-outputs/flat-outputs.json
echo -e "${GREEN}✅ Outputs saved to cfn-outputs/flat-outputs.json${NC}"

if [ "$OUTPUT_JSON" != "{}" ]; then
    echo -e "${BLUE}📋 Stack Outputs:${NC}"
    echo "$OUTPUT_JSON" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for key, value in data.items():
        print(f'  • {key}: {value}')
except:
    pass
"
else
    echo -e "${YELLOW}ℹ️  No stack outputs defined${NC}"
fi

# Final summary
echo -e "${CYAN}🎯 Deployment Summary:${NC}"
echo -e "${BLUE}  • Stack: $STACK_NAME${NC}"
echo -e "${BLUE}  • Status: $STACK_STATUS${NC}"
echo -e "${BLUE}  • Resources: $TOTAL_RESOURCES deployed${NC}"
echo -e "${BLUE}  • Duration: ${DEPLOYMENT_DURATION}s${NC}"
echo -e "${BLUE}  • LocalStack: http://localhost:4566${NC}"

# Final completion message
FINAL_FAILED_COUNT=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
    --query 'length(StackEvents[?ResourceStatus==`CREATE_FAILED`])' --output text 2>/dev/null || echo "0")

if [ "$FINAL_FAILED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  CDK deployment completed with $FINAL_FAILED_COUNT failed resources${NC}"
else
    echo -e "${GREEN}🎉 CDK deployment to LocalStack completed successfully!${NC}"
fi

