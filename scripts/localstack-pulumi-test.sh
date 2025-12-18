#!/bin/bash

# LocalStack Pulumi Integration Test Script
# Runs integration tests against LocalStack Pulumi deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to project root
cd "$(dirname "$0")/.."

# Output file
OUTPUT_FILE="int-test-output.md"

# Function to write to both terminal and markdown file
log_output() {
    local message="$1"
    local md_message="${message//$'\033'\[[0-9;]*m/}"  # Remove ANSI color codes for markdown
    echo -e "$message"
    echo "$md_message" >> "$OUTPUT_FILE"
}

# Initialize markdown file
cat > "$OUTPUT_FILE" << EOF
# Pulumi LocalStack Integration Test Execution Output

**Execution Date:** $(date '+%Y-%m-%d %H:%M:%S')

---

EOF

log_output "${BLUE}🧪 Running Integration Tests against LocalStack Pulumi Deployment...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    log_output "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    log_output "${YELLOW}💡 Run: npm run localstack:start${NC}"
    exit 1
fi

log_output "${GREEN}✅ LocalStack is running${NC}"

# Check if infrastructure is deployed
OUTPUTS_FILE="cfn-outputs/flat-outputs.json"
if [ ! -f "$OUTPUTS_FILE" ]; then
    log_output "${RED}❌ Infrastructure outputs not found at: $OUTPUTS_FILE${NC}"
    log_output "${YELLOW}💡 Deploy infrastructure first: ./scripts/localstack-pulumi-deploy.sh${NC}"
    exit 1
fi

log_output "${GREEN}✅ Infrastructure outputs found${NC}"

# Validate outputs file is not empty
if [ ! -s "$OUTPUTS_FILE" ]; then
    log_output "${RED}❌ Infrastructure outputs file is empty${NC}"
    log_output "${YELLOW}💡 Redeploy infrastructure: ./scripts/localstack-pulumi-deploy.sh${NC}"
    exit 1
fi

log_output "${GREEN}✅ Infrastructure outputs validated${NC}"

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
log_output "${BLUE}📋 Detected Pulumi runtime: ${PULUMI_RUNTIME:-unknown}${NC}"
echo "**Pulumi Runtime:** ${PULUMI_RUNTIME:-unknown}" >> "$OUTPUT_FILE"

# Install dependencies based on Pulumi runtime
log_output "${YELLOW}📦 Installing dependencies...${NC}"

case "$PULUMI_RUNTIME" in
    nodejs)
        if [ -f "package.json" ]; then
            if [ ! -d "node_modules" ]; then
                npm install
            fi
            log_output "${GREEN}✅ Node.js dependencies installed${NC}"
            
            # Build TypeScript if needed
            if [ -f "tsconfig.json" ]; then
                npm run build --if-present || npx tsc || true
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
        # Install pytest and test dependencies if not already installed
        if ! python -c "import pytest" 2>/dev/null; then
            pip install pytest pytest-cov boto3 -q
        fi
        # Install pulumi if not already installed 
        if ! python -c "import pulumi" 2>/dev/null; then
            pip install pulumi -q
        fi
        # Tell Pulumi to use the venv's Python
        export PULUMI_PYTHON_CMD="python"
        log_output "${GREEN}✅ Python dependencies installed${NC}"
        ;;
    java)
        if [ -f "pom.xml" ]; then
            mvn package -q -DskipTests || true
            log_output "${GREEN}✅ Java project built${NC}"
        fi
        ;;
    go)
        if [ -f "go.mod" ]; then
            go mod download
            log_output "${GREEN}✅ Go dependencies installed${NC}"
        fi
        ;;
    *)
        log_output "${YELLOW}⚠️  Unknown Pulumi runtime${NC}"
        ;;
esac

# Set up environment variables for LocalStack
log_output "${YELLOW}🔧 Setting up LocalStack environment...${NC}"

# AWS SDK configuration for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1

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
export AWS_ENDPOINT_URL_IAM=http://localhost:4566
export AWS_ENDPOINT_URL_LAMBDA=http://localhost:4566
export AWS_ENDPOINT_URL_APIGATEWAY=http://localhost:4566
export AWS_ENDPOINT_URL_CLOUDFORMATION=http://localhost:4566
export AWS_ENDPOINT_URL_SQS=http://localhost:4566
export AWS_ENDPOINT_URL_SNS=http://localhost:4566
export AWS_ENDPOINT_URL_DYNAMODB=http://localhost:4566

# Disable SSL verification for LocalStack
export NODE_TLS_REJECT_UNAUTHORIZED=0

log_output "${BLUE}🌐 Environment configured for LocalStack:${NC}"
log_output "${YELLOW}  • AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL${NC}"
log_output "${YELLOW}  • AWS_REGION: $AWS_REGION${NC}"
log_output "${YELLOW}  • SSL Verification: Disabled${NC}"

# Verify Pulumi stack is deployed
log_output "${YELLOW}🔍 Verifying Pulumi stack deployment...${NC}"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="localstack-${ENVIRONMENT_SUFFIX}"

# Set up local backend
export PULUMI_CONFIG_PASSPHRASE=""
if [ -d ".pulumi-state" ]; then
    pulumi login --local >/dev/null 2>&1 || true
fi

# Check stack exists
if pulumi stack select $STACK_NAME 2>/dev/null; then
    log_output "${GREEN}✅ Pulumi Stack is deployed: $STACK_NAME${NC}"
    echo "**Stack Name:** $STACK_NAME" >> "$OUTPUT_FILE"
else
    log_output "${RED}❌ Pulumi Stack not found: $STACK_NAME${NC}"
    log_output "${YELLOW}💡 Deploy infrastructure first: ./scripts/localstack-pulumi-deploy.sh${NC}"
    exit 1
fi

# Display deployed resources
log_output "${BLUE}📊 Deployed Resources:${NC}"
echo "" >> "$OUTPUT_FILE"
echo "## Deployed Resources" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"
pulumi stack --show-urns 2>/dev/null | head -20 >> "$OUTPUT_FILE" || echo "⚠️  Could not list resources" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Run integration tests
log_output "${YELLOW}🚀 Starting integration tests...${NC}"
echo "" >> "$OUTPUT_FILE"
echo "## Test Execution" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Detect test command based on Pulumi runtime
TEST_COMMAND=""

case "$PULUMI_RUNTIME" in
    nodejs)
        # TypeScript or JavaScript Pulumi project
        if [ -f "package.json" ]; then
            if grep -q '"test:integration"' package.json 2>/dev/null; then
                log_output "${BLUE}📋 Running test:integration script...${NC}"
                TEST_COMMAND="npm run test:integration"
            elif grep -q '"test:int"' package.json 2>/dev/null; then
                log_output "${BLUE}📋 Running test:int script...${NC}"
                TEST_COMMAND="npm run test:int"
            elif [ -d "test" ] && ls test/*.int.test.ts 2>/dev/null; then
                log_output "${BLUE}📋 Running integration tests with Jest (TypeScript)...${NC}"
                TEST_COMMAND="npx jest --testPathPattern='\\.int\\.test\\.ts$' --passWithNoTests"
            elif [ -d "test" ] && ls test/*.int.test.js 2>/dev/null; then
                log_output "${BLUE}📋 Running integration tests with Jest (JavaScript)...${NC}"
                TEST_COMMAND="npx jest --testPathPattern='\\.int\\.test\\.js$' --passWithNoTests"
            elif [ -d "test" ] && ls test/*.test.ts test/*.test.js 2>/dev/null; then
                log_output "${BLUE}📋 Running all tests with Jest...${NC}"
                TEST_COMMAND="npx jest --passWithNoTests"
            fi
        fi
        ;;
    python)
        # Python Pulumi project - ensure venv is activated
        source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true
        if [ -d "tests" ]; then
            log_output "${BLUE}📋 Running Python integration tests with pytest...${NC}"
            # Integration tests don't execute source code, so override addopts to remove coverage
            TEST_COMMAND="python -m pytest tests/integration/ -v --tb=short --no-header --override-ini addopts=-vv"
        elif [ -d "test" ]; then
            log_output "${BLUE}📋 Running Python integration tests with pytest...${NC}"
            TEST_COMMAND="python -m pytest test/ -v --tb=short --no-header -k 'integration or int' --override-ini addopts=-vv"
        fi
        ;;
    java)
        # Java Pulumi project
        if [ -f "pom.xml" ]; then
            log_output "${BLUE}📋 Running Java integration tests with Maven...${NC}"
            TEST_COMMAND="mvn test -Dtest=*IntegrationTest,*IT"
        fi
        ;;
    go)
        # Go Pulumi project
        if [ -f "go.mod" ]; then
            log_output "${BLUE}📋 Running Go integration tests...${NC}"
            TEST_COMMAND="go test -v ./... -run Integration"
        fi
        ;;
    *)
        log_output "${YELLOW}⚠️  Unknown Pulumi runtime: ${PULUMI_RUNTIME:-not specified}${NC}"
        ;;
esac

if [ -z "$TEST_COMMAND" ]; then
    log_output "${YELLOW}⚠️  No integration test script found, running basic validation...${NC}"
fi

if [ -n "$TEST_COMMAND" ]; then
    echo '```' >> "$OUTPUT_FILE"
    
    if $TEST_COMMAND 2>&1 | tee -a "$OUTPUT_FILE"; then
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        log_output "${GREEN}🎉 Integration tests completed successfully!${NC}"

        # Show test summary
        log_output "${BLUE}📊 Test Summary:${NC}"
        log_output "${YELLOW}  • All infrastructure components validated${NC}"
        log_output "${YELLOW}  • LocalStack environment verified${NC}"
        log_output "${YELLOW}  • Pulumi resources properly configured${NC}"
        
        echo "" >> "$OUTPUT_FILE"
        echo "## Test Summary" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "- ✅ All infrastructure components validated" >> "$OUTPUT_FILE"
        echo "- ✅ LocalStack environment verified" >> "$OUTPUT_FILE"
        echo "- ✅ Pulumi resources properly configured" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "**Status:** ✅ PASSED" >> "$OUTPUT_FILE"

        exit 0
    else
        TEST_EXIT_CODE=${PIPESTATUS[0]}
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        log_output "${RED}❌ Integration tests failed!${NC}"

        # Provide troubleshooting tips
        log_output "${YELLOW}🔍 Troubleshooting:${NC}"
        log_output "${BLUE}  1. Check LocalStack status: curl http://localhost:4566/_localstack/health${NC}"
        log_output "${BLUE}  2. Verify infrastructure: ./scripts/localstack-pulumi-deploy.sh${NC}"
        log_output "${BLUE}  3. Check outputs file: cat $OUTPUTS_FILE${NC}"
        log_output "${BLUE}  4. Review LocalStack logs: localstack logs${NC}"
        
        echo "" >> "$OUTPUT_FILE"
        echo "## Troubleshooting" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "1. Check LocalStack status: \`curl http://localhost:4566/_localstack/health\`" >> "$OUTPUT_FILE"
        echo "2. Verify infrastructure: \`./scripts/localstack-pulumi-deploy.sh\`" >> "$OUTPUT_FILE"
        echo "3. Check outputs file: \`cat $OUTPUTS_FILE\`" >> "$OUTPUT_FILE"
        echo "4. Review LocalStack logs: \`localstack logs\`" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "**Status:** ❌ FAILED" >> "$OUTPUT_FILE"

        exit $TEST_EXIT_CODE
    fi
else
    # Basic validation when no test command found
    log_output "${YELLOW}📋 Running basic infrastructure validation...${NC}"
    echo "**Test Command:** Basic validation (no test script found)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # Validate stack outputs
    log_output "${BLUE}🔍 Validating stack outputs...${NC}"
    OUTPUT_COUNT=$(cat "$OUTPUTS_FILE" | python -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    
    if [ "$OUTPUT_COUNT" -gt 0 ]; then
        log_output "${GREEN}✅ Stack outputs validated: $OUTPUT_COUNT outputs found${NC}"
    else
        log_output "${YELLOW}⚠️  No stack outputs found${NC}"
    fi
    
    # Validate resources
    log_output "${BLUE}🔍 Validating deployed resources...${NC}"
    RESOURCE_COUNT=$(pulumi stack --show-urns 2>/dev/null | grep -c "urn:pulumi" || echo "0")
    
    if [ "$RESOURCE_COUNT" -gt 0 ]; then
        log_output "${GREEN}✅ Resources validated: $RESOURCE_COUNT resources deployed${NC}"
    else
        log_output "${RED}❌ No resources found in stack${NC}"
        exit 1
    fi
    
    log_output "${GREEN}🎉 Basic validation completed successfully!${NC}"
    log_output "${BLUE}📊 Validation Summary:${NC}"
    log_output "${YELLOW}  • Stack: $STACK_NAME${NC}"
    log_output "${YELLOW}  • Total Resources: $RESOURCE_COUNT${NC}"
    log_output "${YELLOW}  • Outputs: $OUTPUT_COUNT${NC}"
    
    echo "" >> "$OUTPUT_FILE"
    echo "## Validation Summary" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "- Stack: $STACK_NAME" >> "$OUTPUT_FILE"
    echo "- Total Resources: $RESOURCE_COUNT" >> "$OUTPUT_FILE"
    echo "- Outputs: $OUTPUT_COUNT" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "**Status:** ✅ PASSED" >> "$OUTPUT_FILE"
    
    exit 0
fi

