#!/bin/bash

# deploy-and-test.sh
# Complete deployment and testing script for integration tests

set -e

echo "🚀 Starting complete deployment and integration testing..."

# Ensure we're in the correct directory
cd "$(dirname "$0")/.."

# Check metadata
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
if [ "$PLATFORM" != "tf" ]; then
  echo "❌ This script is only for Terraform projects. Detected: $PLATFORM"
  exit 1
fi

# Set environment variables
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-pr1541}
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-iac-rlhf-tf-states}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}

echo "Environment configuration:"
echo "  Environment suffix: $ENVIRONMENT_SUFFIX"
echo "  Terraform state bucket: $TERRAFORM_STATE_BUCKET"

# Check AWS credentials
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials are not valid. Please run 'aws configure' first."
    exit 1
fi
echo "✅ AWS credentials verified"

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
./scripts/deploy-without-lock.sh

# Wait a moment for resources to be fully ready
echo "⏳ Waiting for resources to be fully ready..."
sleep 30

# Generate fresh outputs for tests
echo "📊 Generating fresh outputs for integration tests..."
cd lib
terraform output -json > ../tf-outputs/terraform-outputs.json
cd ..

# Create the flat outputs format expected by tests
mkdir -p cfn-outputs

# Convert Terraform outputs and handle arrays properly
node -e "
const fs = require('fs');
const terraformOutputs = JSON.parse(fs.readFileSync('tf-outputs/terraform-outputs.json', 'utf8'));

const flatOutputs = {};
for (const [key, value] of Object.entries(terraformOutputs)) {
    // Extract the actual value from Terraform output format
    flatOutputs[key] = value.value;
}

console.log('Generated outputs:', Object.keys(flatOutputs));
console.log('Sample values:');
for (const [key, value] of Object.entries(flatOutputs)) {
    console.log('  ', key, ':', Array.isArray(value) ? '[array]' : typeof value, Array.isArray(value) ? value.length + ' items' : '');
}

// Write to the file the tests expect
fs.writeFileSync('cfn-outputs/flat-outputs.json', JSON.stringify(flatOutputs, null, 2));
console.log('✅ Generated flat-outputs.json');
"

# Run integration tests
echo "🧪 Running integration tests..."
npm run test:integration

echo ""
echo "🎉 Deployment and integration testing completed successfully!"
