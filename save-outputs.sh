#!/bin/bash
set -e

export ENVIRONMENT_SUFFIX="synth101912655"
export AWS_REGION="us-east-1"
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

echo "Retrieving stack outputs from ${STACK_NAME}..."

# Create cfn-outputs directory if it doesn't exist
mkdir -p cfn-outputs

# Get stack outputs and flatten to simple key-value JSON
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${AWS_REGION} \
  --query 'Stacks[0].Outputs' \
  --output json | jq 'reduce .[] as $item ({}; .[$item.OutputKey] = $item.OutputValue)' \
  > cfn-outputs/flat-outputs.json

echo "Stack outputs saved to cfn-outputs/flat-outputs.json"
cat cfn-outputs/flat-outputs.json
