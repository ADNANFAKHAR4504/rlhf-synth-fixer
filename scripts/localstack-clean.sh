#!/bin/bash

# LocalStack Clean Script
# This script wipes all resources from LocalStack instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🧨 LocalStack Resource Wipe Script${NC}"
echo -e "${YELLOW}⚠️  This will remove ALL resources from LocalStack!${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running. Please start LocalStack first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ LocalStack is running${NC}"

# Confirm before proceeding
read -p "Are you sure you want to wipe ALL LocalStack resources? This cannot be undone! (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏭️  Operation cancelled${NC}"
    exit 0
fi

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

echo -e "${YELLOW}🗑️  Starting resource cleanup...${NC}"

# Function to safely run awslocal commands
run_awslocal() {
    local service=$1
    local command=$2
    echo -e "${BLUE}🔧 Cleaning $service resources...${NC}"
    eval "$command" 2>/dev/null || echo -e "${YELLOW}⚠️  No $service resources found or cleanup failed${NC}"
}

# Clean S3 buckets
echo -e "${YELLOW}📦 Cleaning S3 buckets...${NC}"
BUCKETS=$(awslocal s3api list-buckets --query 'Buckets[].Name' --output text 2>/dev/null || echo "")
if [ ! -z "$BUCKETS" ]; then
    for bucket in $BUCKETS; do
        echo -e "${BLUE}  🗑️  Deleting bucket: $bucket${NC}"
        awslocal s3 rm s3://$bucket --recursive 2>/dev/null || true
        awslocal s3api delete-bucket --bucket $bucket 2>/dev/null || true
    done
else
    echo -e "${YELLOW}  ℹ️  No S3 buckets found${NC}"
fi

# Clean DynamoDB tables
run_awslocal "DynamoDB" "
    TABLES=\$(awslocal dynamodb list-tables --query 'TableNames[]' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$TABLES\" ]; then
        for table in \$TABLES; do
            echo -e \"${BLUE}  🗑️  Deleting DynamoDB table: \$table${NC}\"
            awslocal dynamodb delete-table --table-name \$table 2>/dev/null || true
        done
    fi
"

# Clean Lambda functions
run_awslocal "Lambda" "
    FUNCTIONS=\$(awslocal lambda list-functions --query 'Functions[].FunctionName' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$FUNCTIONS\" ]; then
        for func in \$FUNCTIONS; do
            echo -e \"${BLUE}  🗑️  Deleting Lambda function: \$func${NC}\"
            awslocal lambda delete-function --function-name \$func 2>/dev/null || true
        done
    fi
"

# Clean API Gateway REST APIs
run_awslocal "API Gateway" "
    APIS=\$(awslocal apigateway get-rest-apis --query 'items[].id' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$APIS\" ]; then
        for api in \$APIS; do
            echo -e \"${BLUE}  🗑️  Deleting API Gateway: \$api${NC}\"
            awslocal apigateway delete-rest-api --rest-api-id \$api 2>/dev/null || true
        done
    fi
"

# Clean SQS queues
run_awslocal "SQS" "
    QUEUES=\$(awslocal sqs list-queues --query 'QueueUrls[]' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$QUEUES\" ]; then
        for queue in \$QUEUES; do
            echo -e \"${BLUE}  🗑️  Deleting SQS queue: \$queue${NC}\"
            awslocal sqs delete-queue --queue-url \$queue 2>/dev/null || true
        done
    fi
"

# Clean SNS topics
run_awslocal "SNS" "
    TOPICS=\$(awslocal sns list-topics --query 'Topics[].TopicArn' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$TOPICS\" ]; then
        for topic in \$TOPICS; do
            echo -e \"${BLUE}  🗑️  Deleting SNS topic: \$topic${NC}\"
            awslocal sns delete-topic --topic-arn \$topic 2>/dev/null || true
        done
    fi
"

# Clean CloudFormation stacks
run_awslocal "CloudFormation" "
    STACKS=\$(awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[].StackName' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$STACKS\" ]; then
        for stack in \$STACKS; do
            echo -e \"${BLUE}  🗑️  Deleting CloudFormation stack: \$stack${NC}\"
            awslocal cloudformation delete-stack --stack-name \$stack 2>/dev/null || true
        done
    fi
"

# Clean EC2 instances
run_awslocal "EC2" "
    INSTANCES=\$(awslocal ec2 describe-instances --query 'Reservations[].Instances[?State.Name!=\`terminated\`].InstanceId' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$INSTANCES\" ]; then
        for instance in \$INSTANCES; do
            echo -e \"${BLUE}  🗑️  Terminating EC2 instance: \$instance${NC}\"
            awslocal ec2 terminate-instances --instance-ids \$instance 2>/dev/null || true
        done
    fi
"

# Clean RDS instances
run_awslocal "RDS" "
    INSTANCES=\$(awslocal rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$INSTANCES\" ]; then
        for instance in \$INSTANCES; do
            echo -e \"${BLUE}  🗑️  Deleting RDS instance: \$instance${NC}\"
            awslocal rds delete-db-instance --db-instance-identifier \$instance --skip-final-snapshot 2>/dev/null || true
        done
    fi
"

# Clean VPCs (non-default)
run_awslocal "VPC" "
    VPCS=\$(awslocal ec2 describe-vpcs --query 'Vpcs[?IsDefault==\`false\`].VpcId' --output text 2>/dev/null || echo '')
    if [ ! -z \"\$VPCS\" ]; then
        for vpc in \$VPCS; do
            echo -e \"${BLUE}  🗑️  Deleting VPC: \$vpc${NC}\"
            # Delete associated resources first
            awslocal ec2 describe-subnets --filters Name=vpc-id,Values=\$vpc --query 'Subnets[].SubnetId' --output text 2>/dev/null | xargs -r -n1 awslocal ec2 delete-subnet --subnet-id 2>/dev/null || true
            awslocal ec2 describe-internet-gateways --filters Name=attachment.vpc-id,Values=\$vpc --query 'InternetGateways[].InternetGatewayId' --output text 2>/dev/null | xargs -r -n1 -I {} sh -c 'awslocal ec2 detach-internet-gateway --internet-gateway-id {} --vpc-id \$vpc 2>/dev/null || true; awslocal ec2 delete-internet-gateway --internet-gateway-id {} 2>/dev/null || true' || true
            awslocal ec2 delete-vpc --vpc-id \$vpc 2>/dev/null || true
        done
    fi
"

# Alternative: Use LocalStack's reset endpoint if available
echo -e "${YELLOW}🔄 Attempting LocalStack service reset...${NC}"
curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null && echo -e "${GREEN}✅ LocalStack state reset successful${NC}" || echo -e "${YELLOW}⚠️  LocalStack state reset not available or failed${NC}"

echo -e "${GREEN}🧹 LocalStack cleanup completed!${NC}"
echo -e "${BLUE}💡 All resources have been removed from LocalStack${NC}"
echo -e "${YELLOW}💡 You may want to restart LocalStack for a completely clean state${NC}"