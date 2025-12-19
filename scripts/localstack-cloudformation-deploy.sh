#!/bin/bash

# LocalStack CloudFormation Deploy Script with Real-time Logging
# This script deploys CloudFormation infrastructure to LocalStack with detailed progress monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Clean existing stack
STACKS=$(awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE CREATE_FAILED UPDATE_ROLLBACK_COMPLETE --query 'StackSummaries[].StackName' --output text 2>/dev/null || echo '')
if [ ! -z "$STACKS" ]; then
    for stack in $STACKS; do
        echo -e "${BLUE}  🗑️  Deleting CloudFormation stack: $stack${NC}"
        awslocal cloudformation delete-stack --stack-name $stack 2>/dev/null || true
    done
    sleep 3
fi

# Reset LocalStack state
curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null && echo -e "${GREEN}✅ LocalStack state reset${NC}" || echo -e "${YELLOW}⚠️  State reset not available${NC}"

# Change to lib directory
cd "$(dirname "$0")/../lib"
echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Check template
if [ -f "TapStack.yml" ]; then
    TEMPLATE_FILE="TapStack.yml"
elif [ -f "TapStack.json" ]; then
    TEMPLATE_FILE="TapStack.json"
else
    echo -e "${RED}❌ CloudFormation template not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CloudFormation template found: $TEMPLATE_FILE${NC}"

echo -e "${NC} uploading template to LocalStack S3...${NC}"
# Create a temporary bucket to hold the template
awslocal s3 mb s3://cf-templates-$AWS_DEFAULT_REGION 2>/dev/null || true
awslocal s3 cp $TEMPLATE_FILE s3://cf-templates-$AWS_DEFAULT_REGION/$TEMPLATE_FILE
echo -e "${GREEN}✅ Template uploaded to LocalStack S3${NC}"

# Set stack name and parameters
STACK_NAME="tap-stack-localstack"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

echo -e "${CYAN}🔧 Deploying CloudFormation stack:${NC}"
echo -e "${BLUE}  • Stack Name: $STACK_NAME${NC}"
echo -e "${BLUE}  • Environment: $ENVIRONMENT_SUFFIX${NC}"
echo -e "${BLUE}  • Template: $TEMPLATE_FILE${NC}"

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

# Commented out - using local template file instead of S3 URL
# awslocal cloudformation create-stack \
#     --stack-name $STACK_NAME \
#     --template-url https://cf-templates-$AWS_DEFAULT_REGION.s3.amazonaws.com/$TEMPLATE_FILE \
#     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX \
#     --capabilities CAPABILITY_IAM

echo -e "${YELLOW}⏳ Waiting for stack creation to complete...${NC}"

# Monitor stack creation with detailed progress updates
LAST_RESOURCE_COUNT=0
DEPLOYMENT_START_TIME=$(date +%s)

# Create the stack
echo -e "${YELLOW}📦 Creating CloudFormation stack...${NC}"

CREATE_RESULT=$(awslocal cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX ParameterKey=ProjectName,ParameterValue=cloud-env \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --output json)

if [ $? -eq 0 ]; then
    STACK_ID=$(echo "$CREATE_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('StackId', 'unknown'))")
    echo -e "${GREEN}✅ Stack creation initiated${NC}"
    echo -e "${BLUE}📋 Stack ID: ${STACK_ID}${NC}"
else
    echo -e "${RED}❌ Failed to create stack${NC}"
    exit 1
fi

# Monitor deployment with real-time events
echo -e "${CYAN}📊 Monitoring deployment progress...${NC}"

LAST_EVENT_COUNT=0
COMPLETED_RESOURCES=0
FAILED_RESOURCES=0

while true; do
    # Get stack status
    STACK_STATUS=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")
    
    # Get all events
    EVENTS=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME --output json 2>/dev/null || echo '{"StackEvents":[]}')
    
    # Process and display new events
    CURRENT_EVENT_COUNT=$(echo "$EVENTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(len(data.get('StackEvents', [])))
except:
    print('0')
")
    
    if [ "$CURRENT_EVENT_COUNT" -gt "$LAST_EVENT_COUNT" ]; then
        # Show new events
        echo "$EVENTS" | python3 -c "
import sys, json
from datetime import datetime

try:
    data = json.load(sys.stdin)
    events = data.get('StackEvents', [])
    last_count = int('$LAST_EVENT_COUNT')
    
    # Show newest events first, but only the new ones
    new_events = events[:len(events)-last_count] if last_count > 0 else events
    
    completed = 0
    failed = 0
    
    for event in reversed(new_events):  # Show in chronological order
        timestamp = event.get('Timestamp', '')
        resource_id = event.get('LogicalResourceId', '')
        resource_type = event.get('ResourceType', '')
        status = event.get('ResourceStatus', '')
        reason = event.get('ResourceStatusReason', '')
        
        # Skip stack-level events for cleaner output
        if resource_type == 'AWS::CloudFormation::Stack' and resource_id == '$STACK_NAME':
            continue
            
        # Format timestamp
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            time_str = dt.strftime('%H:%M:%S')
        except:
            time_str = timestamp[:8] if timestamp else ''
            
        # Color code and icon based on status
        if 'COMPLETE' in status:
            color = '\033[0;32m'  # Green
            icon = '✅'
            if 'CREATE_COMPLETE' in status:
                completed += 1
        elif 'IN_PROGRESS' in status:
            color = '\033[0;34m'  # Blue
            icon = '🔄'
        elif 'FAILED' in status:
            color = '\033[0;31m'  # Red  
            icon = '❌'
            failed += 1
        else:
            color = '\033[1;33m'  # Yellow
            icon = '⚠️'
            
        nc = '\033[0m'
        
        print(f'{color}{icon} [{time_str}] {resource_id} ({resource_type}): {status}{nc}')
        if reason and reason.strip() and reason != 'None':
            print(f'    └─ {reason}')
    
    print(f'RESOURCE_COUNTS={completed},{failed}', file=sys.stderr)
    
except Exception as e:
    print(f'Error processing events: {e}', file=sys.stderr)
" 2>/tmp/resource_counts

        LAST_EVENT_COUNT="$CURRENT_EVENT_COUNT"
        
        # Update resource counts
        if [ -f /tmp/resource_counts ]; then
            source /tmp/resource_counts 2>/dev/null || true
            rm -f /tmp/resource_counts
        fi
    fi
    
    # Check for completion
    if [[ "$STACK_STATUS" == "CREATE_COMPLETE" ]]; then
        # Check if any resources failed even though stack completed
        FAILED_COUNT=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'length(StackEvents[?ResourceStatus==`CREATE_FAILED`])' --output text 2>/dev/null || echo "0")
        
        if [ "$FAILED_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Stack completed with $FAILED_COUNT failed resources${NC}"
            echo -e "${YELLOW}📋 Failed resources:${NC}"
            awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
                --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
                --output table --max-items 10 2>/dev/null || true
            echo -e "${YELLOW}⚠️  Deployment completed with warnings - some resources failed${NC}"
        else
            echo -e "${GREEN}✅ Stack deployment completed successfully!${NC}"
        fi
        break
    elif [[ "$STACK_STATUS" =~ ^(CREATE_FAILED|ROLLBACK_COMPLETE|ROLLBACK_FAILED)$ ]]; then
        echo -e "${RED}❌ Stack deployment failed with status: $STACK_STATUS${NC}"
        
        # Show failure summary
        echo -e "${YELLOW}📋 Failure Summary:${NC}"
        awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
            --query 'StackEvents[?contains(ResourceStatus,`FAILED`)].[Timestamp,LogicalResourceId,ResourceType,ResourceStatusReason]' \
            --output table --max-items 10 2>/dev/null || true
        exit 1
    elif [[ "$STACK_STATUS" == "CREATE_IN_PROGRESS" ]]; then
        # Show periodic progress update
        RESOURCE_SUMMARY=$(awslocal cloudformation list-stack-resources --stack-name $STACK_NAME 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    resources = data.get('StackResourceSummaries', [])
    complete = len([r for r in resources if 'COMPLETE' in r.get('ResourceStatus', '')])
    total = len(resources)
    in_progress = len([r for r in resources if 'IN_PROGRESS' in r.get('ResourceStatus', '')])
    print(f'{complete}/{total} complete, {in_progress} in progress')
except:
    print('Status unknown')
" 2>/dev/null || echo "Status unknown")
        
        echo -e "${CYAN}📈 Progress: $RESOURCE_SUMMARY${NC}"
    fi
    
    sleep 4
done

DEPLOYMENT_END_TIME=$(date +%s)
DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))

echo -e "${GREEN}⏱️  Total deployment time: ${DEPLOYMENT_DURATION}s${NC}"

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
mkdir -p ../cfn-outputs

STACK_INFO=$(awslocal cloudformation describe-stacks --stack-name $STACK_NAME)
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

echo "$OUTPUT_JSON" > ../cfn-outputs/flat-outputs.json
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
echo -e "${BLUE}  • Status: $(echo "$STACK_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['Stacks'][0]['StackStatus'])")${NC}"
echo -e "${BLUE}  • Resources: $TOTAL_RESOURCES deployed${NC}"
echo -e "${BLUE}  • Duration: ${DEPLOYMENT_DURATION}s${NC}"
echo -e "${BLUE}  • LocalStack: http://localhost:4566${NC}"

# Final completion message based on overall success
FINAL_FAILED_COUNT=$(awslocal cloudformation describe-stack-events --stack-name $STACK_NAME \
    --query 'length(StackEvents[?ResourceStatus==`CREATE_FAILED`])' --output text 2>/dev/null || echo "0")

if [ "$FINAL_FAILED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  CloudFormation deployment completed with $FINAL_FAILED_COUNT failed resources${NC}"
else
    echo -e "${GREEN}🎉 CloudFormation deployment to LocalStack completed successfully!${NC}"
fi