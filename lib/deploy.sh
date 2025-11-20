#!/bin/bash

# CloudFormation deployment script for multi-environment infrastructure

set -e

# Configuration
STACK_NAME="${1:-myapp-infrastructure}"
ENVIRONMENT="${2:-dev}"
TEMPLATE_FILE="./infrastructure-template.json"
AWS_REGION="us-east-1"

# Generate environment-specific suffix
TIMESTAMP=$(date +%s)
ENVIRONMENT_SUFFIX="${ENVIRONMENT}-${TIMESTAMP}"

echo "Deploying CloudFormation stack: ${STACK_NAME}"
echo "Environment: ${ENVIRONMENT}"
echo "Environment Suffix: ${ENVIRONMENT_SUFFIX}"
echo "Region: ${AWS_REGION}"
echo ""

# Validate template
echo "Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://${TEMPLATE_FILE} \
  --region ${AWS_REGION} > /dev/null

echo "Template validation passed"
echo ""

# Deploy stack
echo "Creating/updating CloudFormation stack..."
aws cloudformation deploy \
  --template-file ${TEMPLATE_FILE} \
  --stack-name ${STACK_NAME} \
  --parameter-overrides \
    EnvironmentName=${ENVIRONMENT} \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    ApplicationName=myapp \
    ContainerImage=nginx:latest \
    ContainerPort=80 \
  --region ${AWS_REGION} \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_IAM

echo ""
echo "Stack deployment completed"
echo ""

# Display outputs
echo "Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${AWS_REGION} \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
