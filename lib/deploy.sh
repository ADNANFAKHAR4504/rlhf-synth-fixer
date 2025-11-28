#!/bin/bash
set -e

export PULUMI_CONFIG_PASSPHRASE=""
export AWS_REGION=us-east-1
export PULUMI_BACKEND_URL="file://~"

echo "===== Starting Pulumi Deployment ====="
echo "Stack: dev-synthi3k9m2t1"
echo "Region: $AWS_REGION"
echo "Time: $(date)"
echo ""

# Select stack
pulumi stack select dev-synthi3k9m2t1

# Run deployment
echo "Running pulumi up..."
pulumi up --yes --skip-preview

echo ""
echo "===== Deployment Complete ====="
echo "Time: $(date)"
