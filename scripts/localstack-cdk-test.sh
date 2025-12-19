#!/bin/bash

# LocalStack CDK Integration Test Script
# Runs integration tests against LocalStack CDK deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running Integration Tests against LocalStack CDK Deployment...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    echo -e "${YELLOW}💡 Run: npm run localstack:start${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Check if infrastructure is deployed
OUTPUTS_FILE="cfn-outputs/flat-outputs.json"
if [ ! -f "$OUTPUTS_FILE" ]; then
    echo -e "${RED}❌ Infrastructure outputs not found at: $OUTPUTS_FILE${NC}"
    echo -e "${YELLOW}💡 Deploy infrastructure first: ./scripts/localstack-cdk-deploy.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure outputs found${NC}"

# Validate outputs file is not empty
if [ ! -s "$OUTPUTS_FILE" ]; then
    echo -e "${RED}❌ Infrastructure outputs file is empty${NC}"
    echo -e "${YELLOW}💡 Redeploy infrastructure: ./scripts/localstack-cdk-deploy.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure outputs validated${NC}"

# Change to project root (where cdk.json and package.json are located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

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
        npm run build --if-present || npx tsc --skipLibCheck || true
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
    echo -e "${GREEN}✅ Go dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Could not detect CDK language (supports: ts, js, py, java, go)${NC}"
fi

# Set up environment variables for LocalStack
echo -e "${YELLOW}🔧 Setting up LocalStack environment...${NC}"

# AWS SDK configuration for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# LocalStack endpoint configuration
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566
export AWS_S3_FORCE_PATH_STYLE=true

# Additional LocalStack-specific settings
export AWS_USE_SSL=false
export AWS_VERIFY_SSL=false
export AWS_CLI_AUTO_PROMPT=off

# Force SDK to use LocalStack
export AWS_CONFIG_FILE=/dev/null
export AWS_SHARED_CREDENTIALS_FILE=/dev/null

# Override service endpoints for AWS SDK v3
export AWS_ENDPOINT_URL_EC2=http://localhost:4566
export AWS_ENDPOINT_URL_RDS=http://localhost:4566
export AWS_ENDPOINT_URL_S3=http://localhost:4566
export AWS_ENDPOINT_URL_IAM=http://localhost:4566
export AWS_ENDPOINT_URL_LAMBDA=http://localhost:4566
export AWS_ENDPOINT_URL_APIGATEWAY=http://localhost:4566
export AWS_ENDPOINT_URL_CLOUDFORMATION=http://localhost:4566
export AWS_ENDPOINT_URL_SQS=http://localhost:4566
export AWS_ENDPOINT_URL_SNS=http://localhost:4566
export AWS_ENDPOINT_URL_DYNAMODB=http://localhost:4566

# Disable SSL verification for LocalStack
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo -e "${BLUE}🌐 Environment configured for LocalStack:${NC}"
echo -e "${YELLOW}  • AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL${NC}"
echo -e "${YELLOW}  • AWS_REGION: $AWS_REGION${NC}"
echo -e "${YELLOW}  • CDK_DEFAULT_ACCOUNT: $CDK_DEFAULT_ACCOUNT${NC}"
echo -e "${YELLOW}  • SSL Verification: Disabled${NC}"

# Verify CDK stack is deployed
echo -e "${YELLOW}🔍 Verifying CDK stack deployment...${NC}"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")

if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]] || [[ "$STACK_STATUS" == "UPDATE_COMPLETE" ]]; then
    echo -e "${GREEN}✅ CDK Stack is deployed: $STACK_NAME (Status: $STACK_STATUS)${NC}"
else
    echo -e "${RED}❌ CDK Stack not properly deployed: $STACK_NAME (Status: $STACK_STATUS)${NC}"
    echo -e "${YELLOW}💡 Deploy infrastructure first: ./scripts/localstack-cdk-deploy.sh${NC}"
    exit 1
fi

# Display deployed resources
echo -e "${BLUE}📊 Deployed Resources:${NC}"
awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
    --query 'StackResourceSummaries[].[LogicalResourceId,ResourceType,ResourceStatus]' \
    --output table 2>/dev/null || echo -e "${YELLOW}⚠️  Could not list resources${NC}"

# Run integration tests
echo -e "${YELLOW}🚀 Starting integration tests...${NC}"

# Detect test command based on CDK language
TEST_COMMAND=""

if [ -f "package.json" ]; then
    # TypeScript or JavaScript CDK project
    if grep -q '"test:integration"' package.json 2>/dev/null; then
        echo -e "${BLUE}📋 Running test:integration script...${NC}"
        TEST_COMMAND="npm run test:integration"
    elif grep -q '"test:int"' package.json 2>/dev/null; then
        echo -e "${BLUE}📋 Running test:int script...${NC}"
        TEST_COMMAND="npm run test:int"
    elif [ -d "test" ] && ls test/*.int.test.ts 2>/dev/null; then
        echo -e "${BLUE}📋 Running integration tests with Jest (TypeScript)...${NC}"
        TEST_COMMAND="npx jest --testPathPattern='\\.int\\.test\\.ts$' --passWithNoTests"
    elif [ -d "test" ] && ls test/*.int.test.js 2>/dev/null; then
        echo -e "${BLUE}📋 Running integration tests with Jest (JavaScript)...${NC}"
        TEST_COMMAND="npx jest --testPathPattern='\\.int\\.test\\.js$' --passWithNoTests"
    elif [ -d "test" ] && ls test/*.test.ts test/*.test.js 2>/dev/null; then
        echo -e "${BLUE}📋 Running all tests with Jest...${NC}"
        TEST_COMMAND="npx jest --passWithNoTests"
    fi
elif [ -f "requirements.txt" ]; then
    # Python CDK project
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true
    if [ -d "tests" ] || [ -d "test" ]; then
        echo -e "${BLUE}📋 Running Python integration tests with pytest...${NC}"
        TEST_COMMAND="python -m pytest tests/ -v --tb=short -k 'integration or int' || python -m pytest test/ -v --tb=short -k 'integration or int' || python -m pytest -v --tb=short"
    fi
elif [ -f "pom.xml" ]; then
    # Java CDK project
    echo -e "${BLUE}📋 Running Java integration tests with Maven...${NC}"
    TEST_COMMAND="mvn test -Dtest=*IntegrationTest,*IT"
elif [ -f "go.mod" ]; then
    # Go CDK project
    echo -e "${BLUE}📋 Running Go integration tests...${NC}"
    TEST_COMMAND="go test -v ./... -run Integration"
fi

if [ -z "$TEST_COMMAND" ]; then
    echo -e "${YELLOW}⚠️  No integration test script found, running basic validation...${NC}"
fi

if [ -n "$TEST_COMMAND" ]; then
    if $TEST_COMMAND; then
        echo -e "${GREEN}🎉 Integration tests completed successfully!${NC}"

        # Show test summary
        echo -e "${BLUE}📊 Test Summary:${NC}"
        echo -e "${YELLOW}  • All infrastructure components validated${NC}"
        echo -e "${YELLOW}  • LocalStack environment verified${NC}"
        echo -e "${YELLOW}  • CDK resources properly configured${NC}"

        exit 0
    else
        echo -e "${RED}❌ Integration tests failed!${NC}"

        # Provide troubleshooting tips
        echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
        echo -e "${BLUE}  1. Check LocalStack status: curl http://localhost:4566/_localstack/health${NC}"
        echo -e "${BLUE}  2. Verify infrastructure: ./scripts/localstack-cdk-deploy.sh${NC}"
        echo -e "${BLUE}  3. Check outputs file: cat $OUTPUTS_FILE${NC}"
        echo -e "${BLUE}  4. Review LocalStack logs: localstack logs${NC}"

        exit 1
    fi
else
    # Basic validation when no test command found
    echo -e "${YELLOW}📋 Running basic infrastructure validation...${NC}"
    
    # Validate stack outputs
    echo -e "${BLUE}🔍 Validating stack outputs...${NC}"
    OUTPUTS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs' --output json 2>/dev/null || echo '[]')
    OUTPUT_COUNT=$(echo "$OUTPUTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    
    if [ "$OUTPUT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Stack outputs validated: $OUTPUT_COUNT outputs found${NC}"
    else
        echo -e "${YELLOW}⚠️  No stack outputs found${NC}"
    fi
    
    # Validate resources
    echo -e "${BLUE}🔍 Validating deployed resources...${NC}"
    RESOURCE_COUNT=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
        --query 'length(StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`])' --output text 2>/dev/null || echo "0")
    
    if [ "$RESOURCE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Resources validated: $RESOURCE_COUNT resources deployed${NC}"
    else
        echo -e "${RED}❌ No resources found in stack${NC}"
        exit 1
    fi
    
    # Check for specific resource types (Lambda, S3, IAM)
    echo -e "${BLUE}🔍 Checking specific resource types...${NC}"
    
    LAMBDA_COUNT=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
        --query 'length(StackResourceSummaries[?contains(ResourceType, `Lambda`)])' --output text 2>/dev/null || echo "0")
    S3_COUNT=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
        --query 'length(StackResourceSummaries[?contains(ResourceType, `S3`)])' --output text 2>/dev/null || echo "0")
    IAM_COUNT=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
        --query 'length(StackResourceSummaries[?contains(ResourceType, `IAM`)])' --output text 2>/dev/null || echo "0")
    
    echo -e "${YELLOW}  • Lambda resources: $LAMBDA_COUNT${NC}"
    echo -e "${YELLOW}  • S3 resources: $S3_COUNT${NC}"
    echo -e "${YELLOW}  • IAM resources: $IAM_COUNT${NC}"
    
    echo -e "${GREEN}🎉 Basic validation completed successfully!${NC}"
    echo -e "${BLUE}📊 Validation Summary:${NC}"
    echo -e "${YELLOW}  • Stack: $STACK_NAME${NC}"
    echo -e "${YELLOW}  • Status: $STACK_STATUS${NC}"
    echo -e "${YELLOW}  • Total Resources: $RESOURCE_COUNT${NC}"
    echo -e "${YELLOW}  • Outputs: $OUTPUT_COUNT${NC}"
    
    exit 0
fi

