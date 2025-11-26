#!/bin/bash
set -e

export ENVIRONMENT_SUFFIX="synth101912655"
export AWS_REGION="us-east-1"
export CURRENT_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REPOSITORY="TuringGpt/iac-test-automations"
export COMMIT_AUTHOR="qa-agent"
export PR_NUMBER="synth101912655"
export TEAM="synth"
export CREATED_AT=$(date -u +"%Y-%m-%dT%H-%M-%SZ")

echo "Deploying CloudFormation stack..."
echo "  Stack Name: TapStack${ENVIRONMENT_SUFFIX}"
echo "  Environment Suffix: ${ENVIRONMENT_SUFFIX}"
echo "  Region: ${AWS_REGION}"
echo "  Account: ${CURRENT_ACCOUNT_ID}"

aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags \
    Repository=${REPOSITORY} \
    Author=${COMMIT_AUTHOR} \
    PRNumber=${PR_NUMBER} \
    Team=${TEAM} \
    CreatedAt=${CREATED_AT} \
  --s3-bucket="iac-rlhf-cfn-states-${AWS_REGION}-${CURRENT_ACCOUNT_ID}" \
  --s3-prefix=${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION}

echo "Deployment completed successfully!"
