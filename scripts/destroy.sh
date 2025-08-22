#!/bin/bash

# Exit on any error, but allow destroy commands to fail gracefully
set -e

# Read platform and language from metadata.json
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

# Set default environment variables if not provided
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}

echo "Environment suffix: $ENVIRONMENT_SUFFIX"
if [ -n "$TERRAFORM_STATE_BUCKET" ]; then
  echo "Terraform state bucket: $TERRAFORM_STATE_BUCKET"
  echo "Terraform state bucket region: $TERRAFORM_STATE_BUCKET_REGION"
fi

# Destroy resources based on platform
if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK destroy..."
  # Try to destroy any leftover resources, but don't fail if they don't exist
  npm run cdk:destroy || echo "No resources to destroy or destruction failed"
elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, running CDKTF destroy..."
  # Try to destroy any leftover resources, but don't fail if they don't exist
  npm run cdktf:destroy || echo "No resources to destroy or destruction failed"
elif [ "$PLATFORM" = "cfn" ]; then
  echo "✅ CloudFormation project detected, running CloudFormation destroy..."
  # Try to destroy any leftover resources, but don't fail if they don't exist
  npm run cfn:destroy || echo "No resources to destroy or destruction failed"
elif [ "$PLATFORM" = "tf" ]; then
  echo "✅ Terraform HCL project detected, running Terraform destroy..."
  
  if [ -n "$TERRAFORM_STATE_BUCKET" ]; then
    # Set up PR-specific state management
    STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
    echo "Using state key: $STATE_KEY"
    
    # Try to destroy any leftover resources, but don't fail if they don't exist
    cd lib

    # Initialize backend with lockfile (no DynamoDB)
    export TF_INIT_OPTS="-backend-config=bucket=${TERRAFORM_STATE_BUCKET} \
        -backend-config=key=$STATE_KEY \
        -backend-config=region=${TERRAFORM_STATE_BUCKET_REGION} \
        -backend-config=encrypt=true \
        -backend-config=use_lockfile=true"
    terraform init -reconfigure -upgrade $TF_INIT_OPTS || echo "Terraform init failed"

    npm run tf:destroy || echo "No resources to destroy or destruction failed"
    cd ..
    
    # Clean up PR-specific state file
    echo "Cleaning up PR-specific state file..."
    aws s3 rm "s3://${TERRAFORM_STATE_BUCKET}/$STATE_KEY" || echo "State file not found or already cleaned up"
  else
    echo "⚠️ TERRAFORM_STATE_BUCKET not set, skipping Terraform destroy"
  fi
elif [ "$PLATFORM" = "pulumi" ]; then
  echo "✅ Pulumi project detected, running Pulumi destroy..."
  echo "Selecting dev stack..."
  pipenv run pulumi-create-stack || echo "Stack selection failed"
  echo "Destroying Pulumi infrastructure..."
  pipenv run pulumi-destroy || echo "No resources to destroy or destruction failed"
  echo "Removing Pulumi stack..."
  pipenv run pulumi-remove-stack || echo "Stack removal failed or stack doesn't exist"
else
  echo "ℹ️ Platform '$PLATFORM' with language '$LANGUAGE' not supported for destruction, skipping destroy"
  echo "💡 Consider adding cleanup logic for $PLATFORM/$LANGUAGE projects here"
  exit 0
fi

echo "Destroy completed successfully"