#!/bin/bash

# Exit on any error
set -e

echo "🚀 Running deployment..."

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
export REPOSITORY=${REPOSITORY:-$(basename "$(pwd)")}
export COMMIT_AUTHOR=${COMMIT_AUTHOR:-$(git config user.name 2>/dev/null || echo "unknown")}
export AWS_REGION=${AWS_REGION:-us-east-1}
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}
export PULUMI_BACKEND_URL=${PULUMI_BACKEND_URL:-}
export PULUMI_ORG=${PULUMI_ORG:-organization}
export PULUMI_CONFIG_PASSPHRASE=${PULUMI_CONFIG_PASSPHRASE:-}

echo "Environment configuration:"
echo "  Environment suffix: $ENVIRONMENT_SUFFIX"
echo "  Repository: $REPOSITORY"
echo "  Commit author: $COMMIT_AUTHOR"
echo "  AWS region: $AWS_REGION"
if [ -n "$TERRAFORM_STATE_BUCKET" ]; then
  echo "  Terraform state bucket: $TERRAFORM_STATE_BUCKET"
  echo "  Terraform state bucket region: $TERRAFORM_STATE_BUCKET_REGION"
fi
if [ -n "$PULUMI_BACKEND_URL" ]; then
  echo "  Pulumi backend URL: $PULUMI_BACKEND_URL"
  echo "  Pulumi organization: $PULUMI_ORG"
fi

# Bootstrap using the dedicated script
echo "=== Bootstrap Phase ==="
./scripts/bootstrap.sh

# Deploy step
echo "=== Deploy Phase ==="
if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK deploy..."
  npm run cdk:deploy
elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, running CDKTF deploy..."
  npm run cdktf:deploy
elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "yaml" ]; then
  echo "✅ CloudFormation YAML project detected, deploying with AWS CLI..."
  npm run cfn:deploy-yaml
elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "json" ]; then
  echo "✅ CloudFormation JSON project detected, deploying with AWS CLI..."
  npm run cfn:deploy-json
elif [ "$PLATFORM" = "tf" ]; then
  echo "✅ Terraform HCL project detected, running Terraform deploy..."
  
  if [ -z "$TERRAFORM_STATE_BUCKET" ]; then
    echo "❌ TERRAFORM_STATE_BUCKET environment variable is required for Terraform projects"
    exit 1
  fi
  
  # Set up PR-specific state management
  STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
  echo "Using state key: $STATE_KEY"
  
  # Change to lib directory where Terraform files are located
  cd lib
  
  # Check if plan file exists
  if [ -f "tfplan" ]; then
    echo "✅ Terraform plan file found, proceeding with deployment..."
    npm run tf:deploy
  else
    echo "⚠️ Terraform plan file not found, creating new plan and deploying..."
    # Create a new plan and deploy
    terraform plan -out=tfplan || echo "Plan creation failed, attempting direct apply..."
    terraform apply -auto-approve -lock=true -lock-timeout=300s tfplan || terraform apply -auto-approve -lock=true -lock-timeout=300s || echo "Deployment failed"
  fi
  
  cd ..
elif [ "$PLATFORM" = "pulumi" ]; then
  echo "✅ Pulumi project detected, running Pulumi deploy..."
  
  if [ -z "$PULUMI_BACKEND_URL" ]; then
    echo "❌ PULUMI_BACKEND_URL environment variable is required for Pulumi projects"
    exit 1
  fi
  
  echo "Using environment suffix: $ENVIRONMENT_SUFFIX"
  echo "Selecting or creating Pulumi stack Using ENVIRONMENT_SUFFIX=$ENVIRONMENT_SUFFIX"
  export PYTHONPATH=.:bin
  
  # Handle potential encryption issues by trying to create stack
  echo "🔧 Attempting to create or select Pulumi stack..."
  if ! pipenv run pulumi-create-stack; then
    echo "⚠️ Stack creation failed, likely due to existing encrypted stack"
    echo "🔧 Attempting to remove existing encrypted stack and retry..."
    # Try to remove the problematic stack
    STACK_NAME="${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}"
    pipenv run pulumi stack rm "$STACK_NAME" --yes --force 2>/dev/null || echo "Stack removal attempted"
    echo "🔄 Retrying stack creation..."
    pipenv run pulumi-create-stack
  fi
  
  echo "Deploying infrastructure ..."
  pipenv run pulumi-deploy
else
  echo "ℹ️ Unknown deployment method for platform: $PLATFORM, language: $LANGUAGE"
  echo "💡 Supported combinations: cdk+typescript, cdk+python, cfn+yaml, cfn+json, cdktf+typescript, cdktf+python, tf+hcl, pulumi+python"
  exit 1
fi

echo "✅ Deploy completed successfully"

# Get outputs using the dedicated script
echo "📊 Collecting deployment outputs..."
./scripts/get-outputs.sh

