#!/bin/bash
set -e

export ENVIRONMENT_SUFFIX="f657c4d4"
export PULUMI_CONFIG_PASSPHRASE="temp-passphrase-for-testing"
export STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

echo "========================================="
echo "Deploying Pulumi Infrastructure"
echo "========================================="
echo "Environment Suffix: $ENVIRONMENT_SUFFIX"
echo "Stack Name: $STACK_NAME"
echo "Region: us-east-2"
echo "========================================="

pulumi stack select $STACK_NAME
pulumi up --yes --stack $STACK_NAME

echo "========================================="
echo "Deployment Complete!"
echo "========================================="
