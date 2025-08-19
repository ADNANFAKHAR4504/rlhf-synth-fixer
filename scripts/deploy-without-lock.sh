#!/bin/bash

# deploy-without-lock.sh
# Alternative deployment script that bypasses DynamoDB locking issues

set -e

echo "🚀 Running Terraform deployment without DynamoDB locking..."

# Ensure we're in the correct directory
cd "$(dirname "$0")/.."

# Read platform and language from metadata.json
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

if [ "$PLATFORM" != "tf" ]; then
  echo "❌ This script is only for Terraform projects. Detected: $PLATFORM"
  exit 1
fi

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

# Set environment variables
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-pr1541}
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-iac-rlhf-tf-states}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}

echo "Environment configuration:"
echo "  Environment suffix: $ENVIRONMENT_SUFFIX"
echo "  Terraform state bucket: $TERRAFORM_STATE_BUCKET"
echo "  Terraform state bucket region: $TERRAFORM_STATE_BUCKET_REGION"

# Set up state key
STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
echo "Using state key: $STATE_KEY"

cd lib

# Clean up any existing state
echo "🧹 Cleaning up previous state..."
rm -rf .terraform terraform.tfstate terraform.tfstate.backup .terraform.lock.hcl tfplan*

# Initialize Terraform with S3 backend (no DynamoDB)
echo "🔧 Initializing Terraform..."
terraform init -reconfigure -upgrade \
  -backend-config="bucket=${TERRAFORM_STATE_BUCKET}" \
  -backend-config="key=$STATE_KEY" \
  -backend-config="region=${TERRAFORM_STATE_BUCKET_REGION}" \
  -backend-config="encrypt=true"

# Validate configuration
echo "✅ Validating Terraform configuration..."
terraform validate

# Create execution plan
echo "📋 Creating Terraform plan..."
terraform plan -lock=false -out=tfplan

# Apply the plan
echo "🚀 Applying Terraform plan..."
terraform apply -auto-approve -lock=false tfplan

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Resource summary:"
terraform show -json | jq -r '.values.root_module.resources[].type' | sort | uniq -c || echo "Could not generate summary"

cd ..

echo ""
echo "✅ Terraform deployment finished!"
echo "📍 State stored at: s3://${TERRAFORM_STATE_BUCKET}/${STATE_KEY}"
