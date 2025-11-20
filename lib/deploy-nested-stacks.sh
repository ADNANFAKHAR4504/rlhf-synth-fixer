#!/bin/bash
set -e

# CloudFormation Nested Stack Deployment Script
# This script uploads nested stack templates to S3 and deploys the master stack

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="cfn-nested-templates-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID}"
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

echo "====================================="
echo "CloudFormation Nested Stack Deployment"
echo "====================================="
echo "Environment Suffix: ${ENVIRONMENT_SUFFIX}"
echo "AWS Region: ${AWS_REGION}"
echo "Account ID: ${ACCOUNT_ID}"
echo "Bucket Name: ${BUCKET_NAME}"
echo "Stack Name: ${STACK_NAME}"
echo "====================================="

# Step 1: Create S3 bucket for nested stack templates (if it doesn't exist)
echo "Step 1: Creating S3 bucket for nested stack templates..."
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating bucket: ${BUCKET_NAME}"
    if [ "${AWS_REGION}" == "us-east-1" ]; then
        aws s3 mb "s3://${BUCKET_NAME}" --region "${AWS_REGION}"
    else
        aws s3 mb "s3://${BUCKET_NAME}" --region "${AWS_REGION}" --create-bucket-configuration LocationConstraint="${AWS_REGION}"
    fi

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
else
    echo "Bucket already exists: ${BUCKET_NAME}"
fi

# Step 2: Upload nested stack templates to S3
echo ""
echo "Step 2: Uploading nested stack templates to S3..."
aws s3 cp lib/VPCStack.json "s3://${BUCKET_NAME}/templates/VPCStack.json"
aws s3 cp lib/ComputeStack.json "s3://${BUCKET_NAME}/templates/ComputeStack.json"
aws s3 cp lib/DataStack.json "s3://${BUCKET_NAME}/templates/DataStack.json"
echo "Templates uploaded successfully"

# Step 3: Get availability zones
echo ""
echo "Step 3: Getting availability zones..."
AZ1=$(aws ec2 describe-availability-zones --region "${AWS_REGION}" --query 'AvailabilityZones[0].ZoneName' --output text)
AZ2=$(aws ec2 describe-availability-zones --region "${AWS_REGION}" --query 'AvailabilityZones[1].ZoneName' --output text)
AZ3=$(aws ec2 describe-availability-zones --region "${AWS_REGION}" --query 'AvailabilityZones[2].ZoneName' --output text)
echo "AZ1: ${AZ1}"
echo "AZ2: ${AZ2}"
echo "AZ3: ${AZ3}"

# Step 4: Set database credentials
echo ""
echo "Step 4: Setting database credentials..."
DB_USERNAME="${DB_USERNAME:-admin}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')}"
echo "DB Username: ${DB_USERNAME}"
echo "DB Password: [HIDDEN]"

# Step 5: Deploy master stack
echo ""
echo "Step 5: Deploying master stack..."
aws cloudformation deploy \
    --template-file lib/TapStack.json \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        EnvironmentSuffix="${ENVIRONMENT_SUFFIX}" \
        EnvironmentType="dev" \
        CostCenter="iac-qa-team" \
        VpcCidr="10.0.0.0/16" \
        AvailabilityZone1="${AZ1}" \
        AvailabilityZone2="${AZ2}" \
        AvailabilityZone3="${AZ3}" \
        InstanceType="t3.medium" \
        MinSize="2" \
        MaxSize="6" \
        DesiredCapacity="2" \
        DBMasterUsername="${DB_USERNAME}" \
        DBMasterPassword="${DB_PASSWORD}" \
        EnableElastiCache="false" \
        TemplatesBucketName="${BUCKET_NAME}" \
        VPCTemplateKey="templates/VPCStack.json" \
        ComputeTemplateKey="templates/ComputeStack.json" \
        DataTemplateKey="templates/DataStack.json" \
    --tags \
        Repository="synth-n3p3c1" \
        Author="mayanksethi-turing" \
        Team="synth" \
        Environment="${ENVIRONMENT_SUFFIX}" \
    --no-fail-on-empty-changeset

echo ""
echo "====================================="
echo "Deployment initiated successfully!"
echo "====================================="
echo ""
echo "Check deployment status with:"
echo "  aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION}"
echo ""
echo "Get stack outputs with:"
echo "  aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} --query 'Stacks[0].Outputs'"
