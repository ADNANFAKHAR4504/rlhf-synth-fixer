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
TEMPLATE_FILE="TapStack.yml"
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ CloudFormation template not found: $TEMPLATE_FILE${NC}"
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

    if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]]; then
        echo -e "${GREEN}✅ Stack creation completed successfully${NC}"
        break
    elif [[ "$STACK_STATUS" == "CREATE_FAILED" ]] || [[ "$STACK_STATUS" == *"ROLLBACK"* ]]; then
        echo -e "${RED}❌ Stack creation failed with status: $STACK_STATUS${NC}"
        echo -e "${YELLOW}📋 Failed resources:${NC}"
        awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
            --output table
        exit 1
    else
        echo -e "${BLUE}⏳ Stack status: $STACK_STATUS - monitoring resources...${NC}"

        # Show resources being created/updated
        awslocal cloudformation list-stack-resources --stack-name $STACK_NAME \
            --query 'StackResourceSummaries[?ResourceStatus==`CREATE_IN_PROGRESS` || ResourceStatus==`CREATE_COMPLETE`].[LogicalResourceId,ResourceType,ResourceStatus]' \
            --output table 2>/dev/null || true
    fi

    sleep 3
done

echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"

# Get stack outputs
echo -e "${YELLOW}📊 Retrieving stack outputs...${NC}"

# Create cfn-outputs directory if it doesn't exist
mkdir -p ../cfn-outputs

# Get stack description and extract outputs
STACK_INFO=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME)

# Parse outputs to JSON format compatible with integration tests (same format as Terraform)
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
    
    # If no outputs found, print empty JSON
    if not outputs:
        print('{}')
    else:
        print(json.dumps(outputs, indent=2))
except Exception as e:
    print('{}', file=sys.stderr)
    print(f'Error parsing stack outputs: {e}', file=sys.stderr)
    sys.exit(0)
")

# If no outputs, try to extract resource IDs from successfully created resources
if [ "$OUTPUT_JSON" = "{}" ] || [ -z "$OUTPUT_JSON" ]; then
    echo -e "${YELLOW}⚠️  No stack outputs available, extracting resource IDs from resources...${NC}"
    
    # Get all resources without complex jmespath query
    RESOURCES=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME --output json 2>/dev/null || echo '{"StackResourceSummaries":[]}')
    
    OUTPUT_JSON=$(echo "$RESOURCES" | python3 -c "
import sys
import json

try:
    data = json.load(sys.stdin)
    resources = data.get('StackResourceSummaries', [])
    outputs = {}
    
    # Map logical resource IDs to output keys based on common CloudFormation patterns
    resource_map = {
        'RecipeBlogVPC': 'vpc_id',
        'VPC': 'vpc_id',
        'PublicSubnet': 'public_subnet_id',
        'PublicSubnet1': 'public_subnet_1_id',
        'PublicSubnet2': 'public_subnet_2_id',
        'PrivateSubnet': 'private_subnet_id',
        'PrivateSubnet1': 'private_subnet_1_id',
        'PrivateSubnet2': 'private_subnet_2_id',
        'MediaBucket': 's3_bucket_name',
        'LogsBucket': 'logs_bucket_name',
        'AlarmNotificationTopic': 'sns_topic_arn',
        'WordPressDatabase': 'rds_endpoint',
        'Database': 'rds_endpoint',
        'DBInstance': 'rds_endpoint',
        'LoadBalancer': 'alb_arn',
        'ALB': 'alb_arn',
        'ApplicationLoadBalancer': 'alb_arn',
    }
    
    # Extract resource IDs
    for resource in resources:
        status = resource.get('ResourceStatus', '')
        if status == 'CREATE_COMPLETE':
            logical_id = resource.get('LogicalResourceId', '')
            physical_id = resource.get('PhysicalResourceId', '')
            
            if logical_id in resource_map:
                output_key = resource_map[logical_id]
                outputs[output_key] = physical_id
    
    # Collect private subnets if multiple exist
    private_subnets = []
    public_subnets = []
    for resource in resources:
        logical_id = resource.get('LogicalResourceId', '')
        status = resource.get('ResourceStatus', '')
        if status == 'CREATE_COMPLETE':
            if 'PrivateSubnet' in logical_id and logical_id not in ['PrivateSubnetRouteTable']:
                private_subnets.append(resource.get('PhysicalResourceId', ''))
            if 'PublicSubnet' in logical_id and logical_id not in ['PublicSubnetRouteTable']:
                public_subnets.append(resource.get('PhysicalResourceId', ''))
    
    if private_subnets:
        outputs['private_subnet_ids'] = private_subnets
    if public_subnets:
        outputs['public_subnet_ids'] = public_subnets
    
    print(json.dumps(outputs, indent=2))
except Exception as e:
    print('{}')
    print(f'Error extracting resources: {e}', file=sys.stderr)
")
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
