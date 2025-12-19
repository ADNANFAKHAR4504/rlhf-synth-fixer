#!/bin/bash

# Exit on any error
set -e

echo "🔓 Force unlocking Terraform state lock..."

# Check if lock ID is provided
if [ -z "$1" ]; then
  echo "❌ Usage: $0 <lock-id>"
  echo "Example: $0 cf9b30c5-23c6-a9ee-4655-7adac84da06c"
  exit 1
fi

LOCK_ID="$1"

# Read platform and language from metadata.json
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

# Only proceed if this is a Terraform project
if [ "$PLATFORM" != "tf" ]; then
  echo "ℹ️ This script is only for Terraform projects. Current platform: $PLATFORM"
  exit 0
fi

# Set default environment variables if not provided
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}

if [ -z "$TERRAFORM_STATE_BUCKET" ]; then
  echo "❌ TERRAFORM_STATE_BUCKET environment variable is required"
  exit 1
fi

STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
echo "Using state key: $STATE_KEY"

cd lib

# Set up backend configuration
export TF_INIT_OPTS="-backend-config=bucket=${TERRAFORM_STATE_BUCKET} \
    -backend-config=key=$STATE_KEY \
    -backend-config=region=${TERRAFORM_STATE_BUCKET_REGION} \
    -backend-config=encrypt=true \
    -backend-config=use_lockfile=true"

# Initialize Terraform with backend
echo "Initializing Terraform with backend configuration..."
terraform init -reconfigure $TF_INIT_OPTS

# Force unlock the state
echo "Force unlocking state lock: $LOCK_ID"
terraform force-unlock -force "$LOCK_ID"

echo "✅ State lock unlocked successfully"

# Verify by running a plan
echo "Verifying by running terraform plan..."
if terraform plan -out=tfplan -input=false; then
  echo "✅ Terraform plan succeeded after unlock"
else
  echo "⚠️ Terraform plan still failing, check for other issues"
fi

cd ..