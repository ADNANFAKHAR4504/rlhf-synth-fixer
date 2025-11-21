#!/bin/bash
set -e

# Deploy script for CloudFormation stack

STACK_NAME="${1:-inventory-app-dev}"
ENVIRONMENT_SUFFIX="${2:-dev}"
CONTAINER_IMAGE="${3:-nginx:latest}"
REGION="${4:-us-east-1}"

echo "=========================================="
echo "CloudFormation Stack Deployment"
echo "=========================================="
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT_SUFFIX"
echo "Container Image: $CONTAINER_IMAGE"
echo "Region: $REGION"
echo "=========================================="

echo ""
echo "Creating CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name "$STACK_NAME" \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue="$ENVIRONMENT_SUFFIX" \
    ParameterKey=ContainerImage,ParameterValue="$CONTAINER_IMAGE" \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

echo ""
echo "Waiting for stack creation to complete..."
echo "(This may take 15-20 minutes due to NAT Gateways and RDS)"
aws cloudformation wait stack-create-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo ""
echo "=========================================="
echo "Stack creation complete!"
echo "=========================================="

echo ""
echo "Retrieving outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' \
  --region "$REGION")

echo "$OUTPUTS" | jq .

echo ""
echo "=========================================="
echo "Application URL:"
ALB_DNS=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ALBDNSName") | .OutputValue')
echo "  http://$ALB_DNS"
echo "  http://$ALB_DNS/health"
echo "  http://$ALB_DNS/api/"
echo "=========================================="
