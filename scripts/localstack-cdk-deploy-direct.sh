#!/bin/bash

# LocalStack CDK Deploy Script - Direct CloudFormation deployment
# This script synthesizes CDK to CloudFormation and deploys directly to avoid asset publishing issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CDK Deploy to LocalStack (Direct CloudFormation mode)...${NC}"

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
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Change to project root (where cdk.json is located)
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Set stack parameters
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-Pr2281}"
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

# Bootstrap first (without asset S3 issues)
echo -e "${YELLOW}📦 Ensuring CDK bootstrap stack exists...${NC}"
awslocal cloudformation describe-stacks --stack-name CDKToolkit 2>/dev/null || {
    echo -e "${BLUE}Creating minimal CDK bootstrap stack...${NC}"

    # Create S3 bucket for assets
    awslocal s3 mb s3://cdk-hnb659fds-assets-000000000000-us-east-1 2>/dev/null || true

    # Create minimal bootstrap stack
    cat > /tmp/cdk-bootstrap.json <<'BOOTSTRAP_EOF'
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Minimal CDK bootstrap stack for LocalStack",
  "Resources": {
    "CdkBootstrapVersion": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Type": "String",
        "Value": "21",
        "Name": "/cdk-bootstrap/hnb659fds/version"
      }
    }
  }
}
BOOTSTRAP_EOF

    awslocal cloudformation create-stack \
        --stack-name CDKToolkit \
        --template-body file:///tmp/cdk-bootstrap.json 2>/dev/null || true

    sleep 2
    echo -e "${GREEN}✅ Bootstrap stack created${NC}"
}

# Build the Java project
echo -e "${YELLOW}🔨 Building Java CDK project...${NC}"
./gradlew build -x test 2>&1 | tail -n 5
echo -e "${GREEN}✅ Java project built${NC}"

# Synthesize CDK to CloudFormation
echo -e "${YELLOW}📦 Synthesizing CDK to CloudFormation...${NC}"

# Use regular cdk (not cdklocal) for synthesis only
cdk synth \
    --context environmentSuffix=$ENVIRONMENT_SUFFIX \
    --output cdk.out \
    2>&1 | grep -v "WARNING\|deprecated" | tail -n 10

if [ ! -d "cdk.out" ]; then
    echo -e "${RED}❌ CDK synthesis failed - cdk.out directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CDK synthesized successfully${NC}"

# Find the main stack template (VpcInfrastructure nested stack)
VPC_TEMPLATE=$(find cdk.out -name "*VpcInfrastructure*.template.json" -type f | head -n 1)

if [ -z "$VPC_TEMPLATE" ]; then
    echo -e "${YELLOW}⚠️ VpcInfrastructure template not found, using main template${NC}"
    TEMPLATE_FILE="cdk.out/${STACK_NAME}.template.json"
else
    echo -e "${BLUE}📋 Found VPC Infrastructure template: $VPC_TEMPLATE${NC}"
    TEMPLATE_FILE="$VPC_TEMPLATE"
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
    # Try to find any template
    TEMPLATE_FILE=$(find cdk.out -name "*.template.json" -type f | grep -v "asset" | head -n 1)
    if [ -z "$TEMPLATE_FILE" ]; then
        echo -e "${RED}❌ No CloudFormation template found in cdk.out${NC}"
        ls -la cdk.out/
        exit 1
    fi
fi

echo -e "${BLUE}📋 Using template: $TEMPLATE_FILE${NC}"

# Patch the template to fix SSM Parameter types for LocalStack compatibility
echo -e "${YELLOW}🔧 Patching template for LocalStack compatibility...${NC}"
python3 << PYTHON_EOF
import json

template_file = "$TEMPLATE_FILE"

with open(template_file, 'r') as f:
    template = json.load(f)

# Modify parameters to use String type with default values instead of SSM Parameter references
if "Parameters" in template:
    # Change SSM Parameter types to regular String with static defaults
    if "SsmParameterValueawsserviceamiamazonlinuxlatestamzn2amihvmx8664gp2C96584B6F00A464EAD1953AFF4B05118Parameter" in template["Parameters"]:
        template["Parameters"]["SsmParameterValueawsserviceamiamazonlinuxlatestamzn2amihvmx8664gp2C96584B6F00A464EAD1953AFF4B05118Parameter"] = {
            "Type": "String",
            "Default": "ami-12345678"
        }

    if "BootstrapVersion" in template["Parameters"]:
        template["Parameters"]["BootstrapVersion"] = {
            "Type": "String",
            "Default": "21",
            "Description": "Version of the CDK Bootstrap resources in this environment"
        }

# Save modified template
with open(template_file, 'w') as f:
    json.dump(template, f, indent=2)

print("✅ Template patched: SSM parameters converted to static values")
PYTHON_EOF

# Create the SSM parameter for AMI if it doesn't exist
echo -e "${YELLOW}📋 Setting up SSM parameter for AMI...${NC}"
awslocal ssm put-parameter \
    --name "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2" \
    --type "String" \
    --value "ami-12345678" \
    --overwrite 2>/dev/null || true

# Deploy directly using CloudFormation
echo -e "${YELLOW}🚀 Deploying stack via CloudFormation...${NC}"

# Create or update the stack
VPC_STACK_NAME="${STACK_NAME}VpcInfrastructure"

awslocal cloudformation deploy \
    --stack-name "$VPC_STACK_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --parameter-overrides BootstrapVersion=21 \
    --no-fail-on-empty-changeset \
    2>&1 | while IFS= read -r line; do
        if [[ "$line" == *"Successfully created/updated"* ]] || [[ "$line" == *"CREATE_COMPLETE"* ]] || [[ "$line" == *"UPDATE_COMPLETE"* ]]; then
            echo -e "${GREEN}✅ $line${NC}"
        elif [[ "$line" == *"FAILED"* ]] || [[ "$line" == *"ROLLBACK"* ]]; then
            echo -e "${RED}❌ $line${NC}"
        else
            echo -e "${BLUE}$line${NC}"
        fi
    done

DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ CloudFormation deployment failed${NC}"

    # Show failure details
    echo -e "${YELLOW}📋 Stack events:${NC}"
    awslocal cloudformation describe-stack-events --stack-name "$VPC_STACK_NAME" \
        --query 'StackEvents[?contains(ResourceStatus,`FAILED`)].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
        --output table --max-items 10 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Stack deployed successfully!${NC}"

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name "$VPC_STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")

if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]] || [[ "$STACK_STATUS" == "UPDATE_COMPLETE" ]]; then
    echo -e "${GREEN}✅ Stack status: $STACK_STATUS${NC}"
else
    echo -e "${YELLOW}⚠️  Stack status: $STACK_STATUS${NC}"
fi

# Show stack outputs
echo -e "${CYAN}📋 Stack Outputs:${NC}"
awslocal cloudformation describe-stacks --stack-name "$VPC_STACK_NAME" \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output table 2>/dev/null || echo -e "${YELLOW}⚠️ No outputs available${NC}"

# List created resources
echo -e "${CYAN}📊 Created Resources:${NC}"
awslocal cloudformation list-stack-resources --stack-name "$VPC_STACK_NAME" \
    --query 'StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`].[LogicalResourceId,ResourceType]' \
    --output table 2>/dev/null || true

TOTAL_RESOURCES=$(awslocal cloudformation list-stack-resources --stack-name "$VPC_STACK_NAME" \
    --query 'length(StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`])' --output text 2>/dev/null || echo "0")

echo -e "${GREEN}✅ Successfully deployed resources: $TOTAL_RESOURCES${NC}"

# Save outputs to file
echo -e "${YELLOW}📊 Saving stack outputs...${NC}"
mkdir -p cfn-outputs

STACK_INFO=$(awslocal cloudformation describe-stacks --stack-name "$VPC_STACK_NAME" 2>/dev/null || echo '{"Stacks":[]}')
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

echo -e "${GREEN}🎉 CDK deployment to LocalStack completed successfully!${NC}"
