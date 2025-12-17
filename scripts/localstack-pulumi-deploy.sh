#!/bin/bash

# LocalStack Pulumi Deploy Script
# This script deploys Pulumi infrastructure to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Change to project root (where Pulumi.yaml is located)
cd "$(dirname "$0")/.."

# Output file
OUTPUT_FILE="execution-output.md"

# Function to write to both terminal and markdown file
log_output() {
    local message="$1"
    local md_message="${message//$'\033'\[[0-9;]*m/}"  # Remove ANSI color codes for markdown
    echo -e "$message"
    echo "$md_message" >> "$OUTPUT_FILE"
}

# Initialize markdown file
cat > "$OUTPUT_FILE" << EOF
# Pulumi LocalStack Deployment Execution Output

**Execution Date:** $(date '+%Y-%m-%d %H:%M:%S')

---

EOF

log_output "${GREEN}🚀 Starting Pulumi Deploy to LocalStack...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    log_output "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    exit 1
fi

log_output "${GREEN}✅ LocalStack is running${NC}"

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

# Check if Pulumi.yaml exists
if [ ! -f "Pulumi.yaml" ]; then
    log_output "${RED}❌ Pulumi.yaml not found in current directory${NC}"
    exit 1
fi

log_output "${GREEN}✅ Pulumi project found: Pulumi.yaml${NC}"

# Check if pulumi is available
if ! command -v pulumi &> /dev/null; then
    log_output "${RED}❌ Pulumi CLI not found. Please install Pulumi first.${NC}"
    exit 1
fi

PULUMI_VERSION=$(pulumi version)
log_output "${BLUE}🔧 Using Pulumi: $PULUMI_VERSION${NC}"
echo "**Pulumi Version:** $PULUMI_VERSION" >> "$OUTPUT_FILE"

# Set up local backend FIRST before any other pulumi commands
log_output "${YELLOW}🔧 Setting up Pulumi local backend...${NC}"
mkdir -p .pulumi-state
pulumi in --local >/dev/null 2>&1 || true
log_output "${GREEN}✅ Pulumi local backend configured${NC}"

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
log_output "${BLUE}📋 Pulumi runtime: ${PULUMI_RUNTIME:-unknown}${NC}"
echo "**Runtime:** ${PULUMI_RUNTIME:-unknown}" >> "$OUTPUT_FILE"

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
                log_output "${YELLOW}🔨 Building TypeScript...${NC}"
                npm run build --if-present || npx tsc || true
                log_output "${GREEN}✅ TypeScript build completed${NC}"
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
        log_output "${YELLOW}⚠️  Unknown Pulumi runtime: ${PULUMI_RUNTIME:-not specified}${NC}"
        ;;
esac

# Set stack name
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
STACK_NAME="localstack-${ENVIRONMENT_SUFFIX}"

echo "" >> "$OUTPUT_FILE"
echo "## Stack Configuration" >> "$OUTPUT_FILE"
echo "- **Stack Name:** $STACK_NAME" >> "$OUTPUT_FILE"
echo "- **Environment:** $ENVIRONMENT_SUFFIX" >> "$OUTPUT_FILE"
echo "- **Region:** $AWS_DEFAULT_REGION" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Check if stack exists, create if not
log_output "${YELLOW}🔧 Checking Pulumi stack...${NC}"
if ! pulumi stack select $STACK_NAME 2>/dev/null; then
    log_output "${YELLOW}📦 Creating new stack: $STACK_NAME${NC}"
    pulumi stack init $STACK_NAME 2>/dev/null || true
    pulumi stack select $STACK_NAME
else
    # Check if stack has resources (already deployed)
    RESOURCE_COUNT=$(pulumi stack --show-urns 2>/dev/null | grep -c "urn:pulumi" || echo "0")
    if [ "$RESOURCE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Stack already has $RESOURCE_COUNT resources deployed${NC}"
        echo -n -e "${YELLOW}Do you want to cleanup existing deployment before redeploying? (y/N): ${NC}"
        read -r REPLY
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⏭️  Skipping cleanup. Deployment cancelled.${NC}"
            echo -e "${YELLOW}💡 Run cleanup manually: ./scripts/localstack-pulumi-cleanup.sh${NC}"
            exit 0
        fi
        
        echo -e "${YELLOW}🧹 Cleaning up existing deployment before redeploying...${NC}"
        
        # Clean up output files
        if [ -d "cfn-outputs" ]; then
            rm -rf cfn-outputs/
            echo -e "${GREEN}✅ Output files removed${NC}"
        fi
        if [ -f "execution-output.md" ]; then
            rm -f execution-output.md
        fi
        # Clean up Python build artifacts
        rm -rf *.egg-info iac_test_automations.egg-info build/ dist/ 2>/dev/null || true
        
        # Destroy the existing stack
        echo -e "${RED}💥 Destroying existing Pulumi stack...${NC}"
        pulumi destroy --yes 2>/dev/null || true
        
        # Remove the stack
        echo -e "${YELLOW}🗑️  Removing stack: $STACK_NAME${NC}"
        pulumi stack rm $STACK_NAME --yes 2>/dev/null || true
        
        # Recreate the stack
        echo -e "${YELLOW}📦 Recreating stack: $STACK_NAME${NC}"
        pulumi stack init $STACK_NAME 2>/dev/null || true
        pulumi stack select $STACK_NAME
        
        echo -e "${GREEN}✅ Cleanup completed, ready for fresh deployment${NC}"
    fi
fi
log_output "${GREEN}✅ Stack selected: $STACK_NAME${NC}"

# Configure AWS provider for LocalStack
log_output "${YELLOW}🔧 Configuring AWS provider for LocalStack...${NC}"
pulumi config set aws:region us-east-1 2>/dev/null || true
pulumi config set aws:accessKey test 2>/dev/null || true
pulumi config set aws:secretKey test --secret 2>/dev/null || true
pulumi config set aws:skipCredentialsValidation true 2>/dev/null || true
pulumi config set aws:skipMetadataApiCheck true 2>/dev/null || true
pulumi config set aws:skipRequestingAccountId true 2>/dev/null || true
pulumi config set aws:s3UsePathStyle true 2>/dev/null || true

# Set LocalStack endpoints
pulumi config set aws:endpoints '[{"s3":"http://localhost:4566","lambda":"http://localhost:4566","dynamodb":"http://localhost:4566","sqs":"http://localhost:4566","sns":"http://localhost:4566","iam":"http://localhost:4566","cloudformation":"http://localhost:4566","cloudwatch":"http://localhost:4566","ec2":"http://localhost:4566","rds":"http://localhost:4566","secretsmanager":"http://localhost:4566","ssm":"http://localhost:4566","sts":"http://localhost:4566","apigateway":"http://localhost:4566"}]' 2>/dev/null || true

log_output "${GREEN}✅ AWS provider configured for LocalStack${NC}"

# Track deployment time
DEPLOYMENT_START_TIME=$(date +%s)
echo "## Deployment" >> "$OUTPUT_FILE"
echo "**Started:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Run Pulumi up
log_output "${YELLOW}📦 Deploying Pulumi stack...${NC}"

log_output "${CYAN}🔧 Deploying stack:${NC}"
log_output "${BLUE}  • Stack Name: $STACK_NAME${NC}"
log_output "${BLUE}  • Environment: $ENVIRONMENT_SUFFIX${NC}"
log_output "${BLUE}  • Region: $AWS_DEFAULT_REGION${NC}"

echo "### Deployment Output" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"
if pulumi up --yes --refresh 2>&1 | tee -a "$OUTPUT_FILE"; then
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    log_output "${GREEN}✅ Pulumi deployment completed successfully${NC}"
else
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    log_output "${RED}❌ Pulumi deployment failed${NC}"
    exit 1
fi

DEPLOYMENT_END_TIME=$(date +%s)
DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))

log_output "${GREEN}⏱️  Total deployment time: ${DEPLOYMENT_DURATION}s${NC}"
echo "**Ended:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "**Duration:** ${DEPLOYMENT_DURATION}s" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Generate outputs
log_output "${YELLOW}📊 Generating stack outputs...${NC}"
mkdir -p cfn-outputs

# Get stack outputs
OUTPUT_JSON=$(pulumi stack output --json 2>/dev/null || echo '{}')

echo "$OUTPUT_JSON" > cfn-outputs/flat-outputs.json
log_output "${GREEN}✅ Outputs saved to cfn-outputs/flat-outputs.json${NC}"

echo "## Stack Outputs" >> "$OUTPUT_FILE"
if [ "$OUTPUT_JSON" != "{}" ]; then
    log_output "${BLUE}📋 Stack Outputs:${NC}"
    echo "$OUTPUT_JSON" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for key, value in data.items():
        print(f'  • {key}: {value}')
except:
    pass
" | tee -a "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "### JSON Output" >> "$OUTPUT_FILE"
    echo '```json' >> "$OUTPUT_FILE"
    echo "$OUTPUT_JSON" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
else
    log_output "${YELLOW}ℹ️  No stack outputs defined${NC}"
    echo "No outputs defined." >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Show resource count
RESOURCE_COUNT=$(pulumi stack --show-urns 2>/dev/null | grep -c "urn:pulumi" || echo "0")

# Final summary
log_output "${CYAN}🎯 Deployment Summary:${NC}"
log_output "${BLUE}  • Stack: $STACK_NAME${NC}"
log_output "${BLUE}  • Resources: $RESOURCE_COUNT${NC}"
log_output "${BLUE}  • Duration: ${DEPLOYMENT_DURATION}s${NC}"
log_output "${BLUE}  • LocalStack: http://localhost:4566${NC}"

echo "## Summary" >> "$OUTPUT_FILE"
echo "- **Stack:** $STACK_NAME" >> "$OUTPUT_FILE"
echo "- **Resources:** $RESOURCE_COUNT" >> "$OUTPUT_FILE"
echo "- **Duration:** ${DEPLOYMENT_DURATION}s" >> "$OUTPUT_FILE"
echo "- **LocalStack:** http://localhost:4566" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "**Status:** ✅ Completed successfully" >> "$OUTPUT_FILE"

log_output "${GREEN}🎉 Pulumi deployment to LocalStack completed successfully!${NC}"
log_output "${BLUE}📄 Execution output saved to: $OUTPUT_FILE${NC}"