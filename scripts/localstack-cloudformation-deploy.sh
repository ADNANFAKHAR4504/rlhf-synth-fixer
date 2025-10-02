#!/bin/bash

# LocalStack CloudFormation Deploy Script
# This script deploys CloudFormation infrastructure to LocalStack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CloudFormation Deploy to LocalStack...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Clean LocalStack before deployment
echo -e "${YELLOW}🧹 Cleaning LocalStack resources...${NC}"
SCRIPT_DIR="$(dirname "$0")"

# Run LocalStack clean without confirmation prompt
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Clean CloudFormation stacks
STACKS=$(awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE CREATE_FAILED UPDATE_ROLLBACK_COMPLETE --query 'StackSummaries[].StackName' --output text 2>/dev/null || echo '')
if [ ! -z "$STACKS" ]; then
    for stack in $STACKS; do
        echo -e "${BLUE}  🗑️  Deleting CloudFormation stack: $stack${NC}"
        awslocal cloudformation delete-stack --stack-name $stack 2>/dev/null || true
    done
    sleep 5
fi

# Use LocalStack's reset endpoint
echo -e "${YELLOW}🔄 Resetting LocalStack state...${NC}"
curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null && echo -e "${GREEN}✅ LocalStack state reset successful${NC}" || echo -e "${YELLOW}⚠️  LocalStack state reset not available${NC}"

echo -e "${GREEN}✅ LocalStack cleaned${NC}"

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Change to lib directory
cd "$(dirname "$0")/../lib"

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Check if CloudFormation template exists
# Use LocalStack-compatible template if available, otherwise use main template
if [ -f "TapStack.yml" ]; then
    TEMPLATE_FILE="TapStack.yml"
else
    echo -e "${RED}❌ CloudFormation template not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CloudFormation template found: $TEMPLATE_FILE${NC}"

# Set stack name and parameters
STACK_NAME="tap-stack-localstack"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

echo -e "${YELLOW}🔧 Deploying CloudFormation stack...${NC}"
echo -e "${BLUE}  • Stack Name: $STACK_NAME${NC}"
echo -e "${BLUE}  • Environment Suffix: $ENVIRONMENT_SUFFIX${NC}"

# Check if stack exists and clean it up
if awslocal cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
    echo -e "${YELLOW}🗑️  Stack exists, cleaning up before redeployment...${NC}"

    awslocal cloudformation delete-stack --stack-name $STACK_NAME

    echo -e "${YELLOW}⏳ Waiting for stack deletion to complete...${NC}"

    # Monitor stack deletion
    while true; do
        STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DELETE_COMPLETE")

        if [[ "$STACK_STATUS" == "DELETE_COMPLETE" ]] || [[ "$STACK_STATUS" == "UNKNOWN" ]]; then
            echo -e "${GREEN}✅ Stack deletion completed${NC}"
            break
        elif [[ "$STACK_STATUS" == "DELETE_FAILED" ]]; then
            echo -e "${RED}❌ Stack deletion failed${NC}"
            echo -e "${YELLOW}📋 Failed resources:${NC}"
            awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
                --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
                --output table
            exit 1
        else
            echo -e "${BLUE}⏳ Stack status: $STACK_STATUS${NC}"
        fi

        sleep 3
    done
fi

echo -e "${YELLOW}📦 Creating new stack...${NC}"

awslocal cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX \
    --capabilities CAPABILITY_IAM

echo -e "${YELLOW}⏳ Waiting for stack creation to complete...${NC}"

# Monitor stack creation with progress updates
while true; do
    STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")

    # Check for final states (both success and failure)
    if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]] || [[ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]] || [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]]; then
        if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]]; then
            echo -e "${GREEN}✅ Stack creation completed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Stack creation completed with status: $STACK_STATUS${NC}"
            echo -e "${YELLOW}📋 Failed resources:${NC}"
            awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
                --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
                --output table
            echo -e "${YELLOW}📋 Continuing to extract outputs from successfully created resources...${NC}"
        fi
        break
    elif [[ "$STACK_STATUS" == "CREATE_FAILED" ]] || [[ "$STACK_STATUS" == "DELETE_COMPLETE" ]]; then
        echo -e "${RED}❌ Stack creation failed with status: $STACK_STATUS${NC}"
        echo -e "${YELLOW}📋 Failed resources:${NC}"
        awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
            --output table
        echo -e "${YELLOW}📋 Full stack events for debugging:${NC}"
        awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
            --output table
        exit 1
    else
        echo -e "${BLUE}⏳ Stack status: $STACK_STATUS - monitoring resources...${NC}"

        # Show resources being created/updated
        awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
            --query 'StackResourceSummaries[?ResourceStatus==`CREATE_IN_PROGRESS` || ResourceStatus==`CREATE_COMPLETE` || ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatus]' \
            --output table 2>/dev/null || true
    fi

    sleep 3
done

# Check if there were any failures during deployment
echo -e "${YELLOW}🔍 Checking for any failures during deployment...${NC}"
FAILED_EVENTS=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
    --query 'StackEvents[?contains(ResourceStatus,`FAILED`) || contains(ResourceStatus,`ROLLBACK`)]' \
    --output json 2>/dev/null)

if [ "$FAILED_EVENTS" != "[]" ] && [ ! -z "$FAILED_EVENTS" ]; then
    echo -e "${YELLOW}⚠️  Some resources failed during deployment:${NC}"
    awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
        --query 'StackEvents[?contains(ResourceStatus,`FAILED`) || contains(ResourceStatus,`ROLLBACK`)].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
        --output table
fi

echo -e "${GREEN}✅ CloudFormation stack deployment completed${NC}"

# Get stack outputs
echo -e "${YELLOW}📊 Retrieving stack outputs...${NC}"

# Create cfn-outputs directory if it doesn't exist
mkdir -p ../cfn-outputs

# Get stack description and extract outputs
STACK_INFO=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME)

# Parse outputs to JSON format - directly from CloudFormation stack outputs
OUTPUT_JSON=$(echo "$STACK_INFO" | python3 -c "
import sys
import json

try:
    data = json.load(sys.stdin)
    outputs = {}

    # Extract outputs from CloudFormation stack
    if 'Stacks' in data and len(data['Stacks']) > 0:
        stack_outputs = data['Stacks'][0].get('Outputs', [])
        for output in stack_outputs:
            key = output['OutputKey']
            value = output['OutputValue']
            outputs[key] = value

    print(json.dumps(outputs, indent=2))
except Exception as e:
    print('{}', file=sys.stderr)
    print(f'Error parsing stack outputs: {e}', file=sys.stderr)
")

# Check if we got valid outputs
if [ "$OUTPUT_JSON" = "{}" ] || [ -z "$OUTPUT_JSON" ]; then
    echo -e "${YELLOW}⚠️  No stack outputs defined in the CloudFormation template${NC}"
    echo -e "${YELLOW}⚠️  Add Outputs section to your template to export resource information${NC}"
fi

# Write outputs to file (same format as Terraform)
echo "$OUTPUT_JSON" > ../cfn-outputs/flat-outputs.json

echo -e "${GREEN}✅ Outputs saved to cfn-outputs/flat-outputs.json${NC}"

# Display outputs
if [ "$OUTPUT_JSON" != "{}" ] && [ ! -z "$OUTPUT_JSON" ]; then
    echo -e "${BLUE}📈 Stack Outputs:${NC}"
    echo "$OUTPUT_JSON" | python3 -c "
import sys
import json

try:
    data = json.load(sys.stdin)
    for key, value in data.items():
        if isinstance(value, list):
            print(f'  • {key}: {len(value)} items')
            for item in value:
                print(f'    - {item}')
        else:
            print(f'  • {key}: {value}')
except:
    pass
"
else
    echo -e "${YELLOW}⚠️  No outputs available${NC}"
fi

# Display summary
echo -e "${BLUE}📈 Deployment Summary:${NC}"
echo -e "${YELLOW}  • Stack Name: $STACK_NAME${NC}"
echo -e "${YELLOW}  • Stack Status: $(echo "$STACK_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['Stacks'][0]['StackStatus'])")${NC}"
echo -e "${YELLOW}  • Infrastructure deployed to LocalStack${NC}"
echo -e "${YELLOW}  • Outputs file created for integration tests${NC}"
echo -e "${YELLOW}  • LocalStack endpoint: http://localhost:4566${NC}"

echo -e "${GREEN}🎉 Ready to run integration tests!${NC}"
