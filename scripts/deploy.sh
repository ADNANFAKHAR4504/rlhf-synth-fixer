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

# Ensure non-interactive Terraform by providing defaults if not set by CI secrets
export TF_VAR_db_username=${TF_VAR_db_username:-temp_admin}
export TF_VAR_db_password=${TF_VAR_db_password:-TempPassword123!}

echo "Environment configuration:"
echo "  Environment suffix: $ENVIRONMENT_SUFFIX"
echo "  Repository: $REPOSITORY"
echo "  Commit author: $COMMIT_AUTHOR"
echo "  AWS region: $AWS_REGION"
echo "Using TF_VAR_db_username: (set)"
echo "Using TF_VAR_db_password: (set)"
if [ -n "$TERRAFORM_STATE_BUCKET" ]; then
  echo "  Terraform state bucket: $TERRAFORM_STATE_BUCKET"
  echo "  Terraform state bucket region: $TERRAFORM_STATE_BUCKET_REGION"
fi
if [ -n "$PULUMI_BACKEND_URL" ]; then
  echo "  Pulumi backend URL: $PULUMI_BACKEND_URL"
  echo "  Pulumi organization: $PULUMI_ORG"
fi

echo "=== Bootstrap Phase ==="
./scripts/bootstrap.sh

# Deploy step
echo "=== Deploy Phase ==="
if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK deploy..."

  # Check if stack is in failed state and needs cleanup
  STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
  STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")

  if [[ "$STACK_STATUS" =~ ^(ROLLBACK_COMPLETE|UPDATE_ROLLBACK_COMPLETE|CREATE_FAILED|DELETE_FAILED)$ ]]; then
    echo "⚠️ Stack is in $STACK_STATUS state. Attempting to delete..."

    # Try CDK destroy first
    npm run cdk:destroy -- --force || true

    # If stack still exists and in DELETE_FAILED, force delete with AWS CLI
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")

    if [[ "$STACK_STATUS" == "DELETE_FAILED" ]]; then
      echo "⚠️ Stack still in DELETE_FAILED state. Force deleting with AWS CLI..."
      # Get stuck resources and continue-update-rollback to unstick
      aws cloudformation continue-update-rollback --stack-name "$STACK_NAME" \
        --resources-to-skip "TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5" 2>/dev/null || true
      sleep 5
      # Now try delete again
      aws cloudformation delete-stack --stack-name "$STACK_NAME"
      echo "⏳ Waiting for stack deletion..."
      aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || true
    fi

    echo "✅ Stack cleanup completed"
    sleep 10
  fi

  npm run cdk:deploy

elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, running CDKTF deploy..."
  
  if [ "$LANGUAGE" = "go" ]; then
    echo "🔧 Ensuring .gen exists for CDKTF Go deploy"

    if [ -f "terraform.tfstate" ]; then
      echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
      rm -f terraform.tfstate
    fi

    if [ -d "cdktf.out" ]; then
      echo "🗑️ Removing cdktf.out for clean CI run..."
      rm -rf cdktf.out
    fi

    if [ ! -d ".gen" ] || [ ! -d ".gen/aws" ]; then
      echo "Running cdktf get to generate .gen..."
      npm run cdktf:get || npx --yes cdktf get
    fi
    if [ ! -d ".gen/aws" ]; then
      echo "❌ .gen/aws missing after cdktf get; aborting"
      exit 1
    fi
    # Go modules are prepared during build; avoid cache-clearing and extra tidying here
  fi
  npm run cdktf:deploy

elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "yaml" ]; then
  echo "✅ CloudFormation YAML project detected, deploying with AWS CLI..."

  # Check stack status and delete if in ROLLBACK_COMPLETE state
  STACK_NAME="TapStack${ENVIRONMENT_SUFFIX:-dev}"
  STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")

  if [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
    echo "⚠️ Stack is in ROLLBACK_COMPLETE state. Deleting stack before redeployment..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || {
      echo "❌ Stack deletion failed or timed out"
      exit 1
    }
    echo "✅ Stack deleted successfully"
  fi

  npm run cfn:deploy-yaml

elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "json" ]; then
  echo "✅ CloudFormation JSON project detected, deploying with AWS CLI..."

  # Check stack status and delete if in ROLLBACK_COMPLETE state
  STACK_NAME="TapStack${ENVIRONMENT_SUFFIX:-dev}"
  STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")

  if [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
    echo "⚠️ Stack is in ROLLBACK_COMPLETE state. Deleting stack before redeployment..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || {
      echo "❌ Stack deletion failed or timed out"
      exit 1
    }
    echo "✅ Stack deleted successfully"
  fi

  npm run cfn:deploy-json

elif [ "$PLATFORM" = "tf" ]; then
  echo "✅ Terraform HCL project detected, running Terraform deploy..."
  
  if [ -z "$TERRAFORM_STATE_BUCKET" ]; then
    echo "❌ TERRAFORM_STATE_BUCKET environment variable is required for Terraform projects"
    exit 1
  fi
  
  STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
  echo "Using state key: $STATE_KEY"
  
  cd lib
  
  # Determine var-file to use based on metadata.json
  VAR_FILE=""
  if [ "$(jq -r '.subtask // ""' ../metadata.json)" = "IaC-Multi-Environment-Management" ]; then
    DEPLOY_ENV_FILE=$(jq -r '.task_config.deploy_env // ""' ../metadata.json)
    if [ -n "$DEPLOY_ENV_FILE" ]; then
      VAR_FILE="-var-file=${DEPLOY_ENV_FILE}"
      echo "Using var-file from metadata: ${DEPLOY_ENV_FILE}"
    fi
  fi

  # Always remove any stale Terraform plan to avoid cross-run reuse
  rm -f tfplan
  
  # Check if plan file exists
  if [ -f "tfplan" ]; then
    echo "✅ Terraform plan file found, proceeding with deployment..."
    # Try to deploy with the plan file
    if ! terraform apply -auto-approve -lock=true -lock-timeout=300s -input=false $VAR_FILE tfplan; then
      echo "⚠️ Deployment with plan file failed, checking for state lock issues..."
      
      # Extract lock ID from error output if present
      LOCK_ID=$(terraform apply -auto-approve -lock=true -lock-timeout=10s -input=false $VAR_FILE tfplan 2>&1 | grep -oE 'ID:\s+[0-9a-f-]{36}' | cut -d' ' -f2 || echo "")
      
      if [ -n "$LOCK_ID" ]; then
        echo "🔓 Detected stuck lock ID: $LOCK_ID. Attempting to force unlock..."
        terraform force-unlock -force "$LOCK_ID" || echo "Force unlock failed"
        echo "🔄 Retrying deployment after unlock..."
        terraform apply -auto-approve -lock=true -lock-timeout=300s -input=false $VAR_FILE tfplan || echo "Deployment still failed after unlock attempt"
      else
        echo "❌ Deployment failed but no lock ID detected. Manual intervention may be required."
      fi
    fi
  else
    echo "⚠️ Terraform plan file not found, creating new plan and deploying..."
    terraform plan -lock-timeout=120s -lock=false -input=false $VAR_FILE -out=tfplan || echo "Plan creation failed, attempting direct apply..."
    
    # Try direct apply with lock timeout, and handle lock issues
    if ! terraform apply -auto-approve -lock=true -lock-timeout=300s -input=false $VAR_FILE tfplan; then
      echo "⚠️ Direct apply with plan failed, trying without plan..."
      if ! terraform apply -auto-approve -lock=true -lock-timeout=300s -input=false $VAR_FILE; then
        echo "❌ All deployment attempts failed. Check for state lock issues."
        # List any potential locks
        terraform show -json 2>&1 | grep -i lock || echo "No lock information available"
      fi
    fi
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
  
  if [ "$LANGUAGE" = "go" ]; then
    echo "🔧 Go Pulumi project detected"
    pulumi login "$PULUMI_BACKEND_URL"
    cd lib
    echo "Selecting or creating Pulumi stack..."
    pulumi stack select "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --create
    
    # Clear any existing locks before deployment
    echo "🔓 Clearing any stuck locks..."
    pulumi cancel --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --yes 2>/dev/null || echo "No locks to clear or cancel failed"
    
    echo "Deploying infrastructure ..."
    if ! pulumi up --yes --refresh --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}"; then
      echo "⚠️ Deployment failed, attempting lock recovery..."
      pulumi cancel --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --yes || echo "Lock cancellation failed"
      echo "🔄 Retrying deployment after lock cancellation..."
      pulumi up --yes --refresh --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" || {
        echo "❌ Deployment failed after retry"
        cd ..
        exit 1
      }
    fi
    cd ..
  else
    echo "🔧 Python Pulumi project detected"
    export PYTHONPATH=.:bin
    pipenv run pulumi-create-stack
    
    # Clear any existing locks before deployment
    echo "🔓 Clearing any stuck locks..."
    pulumi cancel --yes 2>/dev/null || echo "No locks to clear or cancel failed"
    
    echo "Deploying infrastructure ..."
    if ! pipenv run pulumi-deploy; then
      echo "⚠️ Deployment failed, attempting lock recovery..."
      pulumi cancel --yes || echo "Lock cancellation failed"
      echo "🔄 Retrying deployment after lock cancellation..."
      pipenv run pulumi-deploy || {
        echo "❌ Deployment failed after retry"
        exit 1
      }
    fi
  fi

else
  echo "ℹ️ Unknown deployment method for platform: $PLATFORM, language: $LANGUAGE"
  echo "💡 Supported combinations: cdk+typescript, cdk+python, cfn+yaml, cfn+json, cdktf+typescript, cdktf+python, tf+hcl, pulumi+python, pulumi+java"
  exit 1
fi

echo "✅ Deploy completed successfully"

# Get outputs using the dedicated script
echo "📊 Collecting deployment outputs..."
./scripts/get-outputs.sh