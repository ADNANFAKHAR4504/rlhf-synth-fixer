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

# Monitor stack creation with detailed progress updates
LAST_RESOURCE_COUNT=0
DEPLOYMENT_START_TIME=$(date +%s)

while true; do
    STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")

    # Get detailed resource information for proper completion checking
    CURRENT_RESOURCES=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME 2>/dev/null || echo '{"StackResourceSummaries":[]}')
    
    # Count resources by status
    COMPLETED_COUNT=$(echo "$CURRENT_RESOURCES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    completed = [r for r in data.get('StackResourceSummaries', []) if r.get('ResourceStatus') == 'CREATE_COMPLETE']
    print(len(completed))
except:
    print('0')
" 2>/dev/null || echo "0")
    
    IN_PROGRESS_COUNT=$(echo "$CURRENT_RESOURCES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    in_progress = [r for r in data.get('StackResourceSummaries', []) if r.get('ResourceStatus') == 'CREATE_IN_PROGRESS']
    print(len(in_progress))
except:
    print('0')
" 2>/dev/null || echo "0")

    TOTAL_COUNT=$(echo "$CURRENT_RESOURCES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(len(data.get('StackResourceSummaries', [])))
except:
    print('0')
" 2>/dev/null || echo "0")

    # Check for final states - stack must be complete AND all resources must be complete
    if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]] && [[ "$IN_PROGRESS_COUNT" -eq 0 ]]; then
        echo -e "${GREEN}✅ Stack creation completed successfully${NC}"
        echo -e "${GREEN}📊 All $TOTAL_COUNT resources created successfully${NC}"
        
        DEPLOYMENT_END_TIME=$(date +%s)
        DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))
        echo -e "${GREEN}⏱️  Deployment time: ${DEPLOYMENT_DURATION}s${NC}"
        break
        
    elif [[ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]] || [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]]; then
        echo -e "${RED}❌ Stack creation failed and rolled back (Status: $STACK_STATUS)${NC}"
        echo -e "${YELLOW}📋 Analyzing failures...${NC}"
        
        # Show failed resources
        FAILED_RESOURCES=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
            --output table 2>/dev/null)
            
        if [ ! -z "$FAILED_RESOURCES" ] && [ "$FAILED_RESOURCES" != "None" ]; then
            echo -e "${YELLOW}📋 Failed resources:${NC}"
            echo "$FAILED_RESOURCES"
        else
            echo -e "${YELLOW}📋 No specific resource failures found. Checking rollback events...${NC}"
            awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
                --query 'StackEvents[?contains(ResourceStatus,`ROLLBACK`) || contains(ResourceStatus,`FAILED`)].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
                --output table --max-items 20
        fi
        exit 1
        
    elif [[ "$STACK_STATUS" == "CREATE_FAILED" ]] || [[ "$STACK_STATUS" == "DELETE_COMPLETE" ]]; then
        echo -e "${RED}❌ Stack creation failed with status: $STACK_STATUS${NC}"
        echo -e "${YELLOW}📋 Failed resources:${NC}"
        awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
            --output table
        exit 1
        
    elif [[ "$STACK_STATUS" == "CREATE_IN_PROGRESS" ]] || [[ "$IN_PROGRESS_COUNT" -gt 0 ]]; then
        # Show progress if resources changed or there are still resources in progress
        if [ "$COMPLETED_COUNT" != "$LAST_RESOURCE_COUNT" ] || [ "$IN_PROGRESS_COUNT" -gt 0 ]; then
            if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]] && [[ "$IN_PROGRESS_COUNT" -gt 0 ]]; then
                echo -e "${BLUE}⏳ Stack marked complete but waiting for remaining resources: $COMPLETED_COUNT/$TOTAL_COUNT completed, $IN_PROGRESS_COUNT still in progress${NC}"
            else
                echo -e "${BLUE}⏳ Stack status: $STACK_STATUS - Progress: $COMPLETED_COUNT/$TOTAL_COUNT completed, $IN_PROGRESS_COUNT in progress${NC}"
            fi
            
            # Show currently creating resources
            if [ "$IN_PROGRESS_COUNT" -gt 0 ]; then
                echo -e "${YELLOW}🔄 Currently creating:${NC}"
                awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
                    --query 'StackResourceSummaries[?ResourceStatus==`CREATE_IN_PROGRESS`].[LogicalResourceId,ResourceType]' \
                    --output table 2>/dev/null || true
            fi
            
            LAST_RESOURCE_COUNT="$COMPLETED_COUNT"
        fi
        
    else
        echo -e "${YELLOW}⏳ Stack status: $STACK_STATUS${NC}"
    fi

    sleep 5
done

# Final validation - only report actual failures for successful stacks
if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]]; then
    echo -e "${YELLOW}🔍 Validating successful deployment...${NC}"
    
    # Check for any resources that failed but stack still completed
    FAILED_RESOURCES=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]' \
        --output json 2>/dev/null)

    if [ "$FAILED_RESOURCES" != "[]" ] && [ ! -z "$FAILED_RESOURCES" ]; then
        echo -e "${YELLOW}⚠️  Note: Some individual resources failed but stack completed successfully:${NC}"
        awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[Timestamp,LogicalResourceId,ResourceType,ResourceStatusReason]' \
            --output table
        echo -e "${GREEN}✅ Stack overall status: SUCCESS (non-critical resource failures)${NC}"
    else
        echo -e "${GREEN}✅ All resources created successfully with no failures${NC}"
    fi
else
    echo -e "${YELLOW}🔍 Final deployment status check complete${NC}"
fi

echo -e "${GREEN}✅ CloudFormation stack deployment completed${NC}"

# Show deployed resources summary
echo -e "${YELLOW}📋 Deployed Resources Summary:${NC}"
awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
    --query 'StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`].[LogicalResourceId,ResourceType,ResourceStatus]' \
    --output table 2>/dev/null | head -20 || echo -e "${YELLOW}⚠️  Could not retrieve resource summary${NC}"

TOTAL_CREATED=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
    --query 'length(StackResourceSummaries[?ResourceStatus==`CREATE_COMPLETE`])' --output text 2>/dev/null || echo "0")
echo -e "${GREEN}📊 Total successfully created resources: $TOTAL_CREATED${NC}"

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
