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

echo "=== Bootstrap Phase ==="
./scripts/bootstrap.sh

# Deploy step
echo "=== Deploy Phase ==="
if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK deploy..."
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
  
  # Pre-deployment checks
  echo "🔍 Pre-deployment checks:"
  echo "  Template file: lib/TapStack.yml"
  echo "  Stack name: TapStack${ENVIRONMENT_SUFFIX}"
  echo "  Environment suffix: ${ENVIRONMENT_SUFFIX}"
  echo "  AWS Region: ${AWS_REGION}"
  echo "  Repository: ${REPOSITORY}"
  echo "  Commit Author: ${COMMIT_AUTHOR}"
  
  # Check if template file exists
  if [ ! -f "lib/TapStack.yml" ]; then
    echo "❌ Template file lib/TapStack.yml not found!"
    exit 1
  fi
  
  # Validate template before deployment
  echo "🔍 Validating CloudFormation template..."
  if aws cloudformation validate-template --template-body file://lib/TapStack.yml > /dev/null 2>&1; then
    echo "✅ Template validation successful"
  else
    echo "❌ Template validation failed!"
    aws cloudformation validate-template --template-body file://lib/TapStack.yml
    exit 1
  fi
  
  # Check S3 bucket exists
  S3_BUCKET="iac-rlhf-cfn-states-${AWS_REGION}"
  echo "🔍 Checking S3 bucket: ${S3_BUCKET}"
  if aws s3 ls "s3://${S3_BUCKET}/" > /dev/null 2>&1; then
    echo "✅ S3 bucket accessible"
  else
    echo "❌ S3 bucket ${S3_BUCKET} not accessible!"
    exit 1
  fi
  
  # Deploy with verbose output
  echo "🚀 Starting CloudFormation deployment..."
  echo "Command: npm run cfn:deploy-yaml"
  npm run cfn:deploy-yaml
  
  # Check deployment result
  DEPLOY_EXIT_CODE=$?
  if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo "✅ CloudFormation deployment completed successfully"
    
    # Get stack outputs
    echo "📊 Stack outputs:"
    aws cloudformation describe-stacks --stack-name "TapStack${ENVIRONMENT_SUFFIX}" --query 'Stacks[0].Outputs' --output table || echo "No outputs found"
    
  else
    echo "❌ CloudFormation deployment failed with exit code: $DEPLOY_EXIT_CODE"
    echo "📊 Checking stack events for errors..."
    aws cloudformation describe-stack-events --stack-name "TapStack${ENVIRONMENT_SUFFIX}" --max-items 10 --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].{Time:Timestamp,Status:ResourceStatus,Type:ResourceType,Reason:ResourceStatusReason}' --output table || echo "Stack may not exist or no events found"
    exit $DEPLOY_EXIT_CODE
  fi

elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "json" ]; then
  echo "✅ CloudFormation JSON project detected, deploying with AWS CLI..."
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
  

  # Always remove any stale Terraform plan to avoid cross-run reuse
  rm -f tfplan
  
  # Check if plan file exists

  if [ -f "tfplan" ]; then
    echo "✅ Terraform plan file found, proceeding with deployment..."
    # Try to deploy with the plan file
    if ! npm run tf:deploy; then
      echo "⚠️ Deployment with plan file failed, checking for state lock issues..."
      
      # Extract lock ID from error output if present
      LOCK_ID=$(terraform apply -auto-approve -lock=true -lock-timeout=10s tfplan 2>&1 | grep -oE 'ID:\s+[0-9a-f-]{36}' | cut -d' ' -f2 || echo "")
      
      if [ -n "$LOCK_ID" ]; then
        echo "🔓 Detected stuck lock ID: $LOCK_ID. Attempting to force unlock..."
        terraform force-unlock -force "$LOCK_ID" || echo "Force unlock failed"
        echo "🔄 Retrying deployment after unlock..."
        npm run tf:deploy || echo "Deployment still failed after unlock attempt"
      else
        echo "❌ Deployment failed but no lock ID detected. Manual intervention may be required."
      fi
    fi
  else
    echo "⚠️ Terraform plan file not found, creating new plan and deploying..."
    terraform plan -out=tfplan || echo "Plan creation failed, attempting direct apply..."
    
    # Try direct apply with lock timeout, and handle lock issues
    if ! terraform apply -auto-approve -lock=true -lock-timeout=300s tfplan; then
      echo "⚠️ Direct apply with plan failed, trying without plan..."
      if ! terraform apply -auto-approve -lock=true -lock-timeout=300s; then
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
    echo "Deploying infrastructure ..."
    pulumi up --yes --refresh --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}"
    cd ..
  else
    echo "🔧 Python Pulumi project detected"
    export PYTHONPATH=.:bin
    pipenv run pulumi-create-stack
    echo "Deploying infrastructure ..."
    pipenv run pulumi-deploy
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
