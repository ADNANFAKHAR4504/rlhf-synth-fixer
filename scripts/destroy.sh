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
  npm run cdk:destroy || echo "No resources to destroy or destruction failed"

elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, running CDKTF destroy..."
  
  if [ "$LANGUAGE" = "go" ]; then
    echo "🔧 Setting up Go dependencies for CDKTF..."

    if [ -f "terraform.tfstate" ]; then
      echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
      rm -f terraform.tfstate
    fi

    if [ -d "cdktf.out" ]; then
      echo "🗑️ Removing cdktf.out for clean CI run..."
      rm -rf cdktf.out
    fi

    # Generate AWS provider code if not already generated
    if [ ! -d ".gen/aws" ]; then
      echo "📦 Generating AWS provider code..."
      cdktf get || echo "cdktf get failed, but continuing with destroy attempt"
    fi
    
    echo "📦 Installing Go dependencies..."
    go mod tidy || echo "go mod tidy failed, but continuing with destroy attempt"
    
    echo "🔨 Building Go project..."
    go build ./lib || echo "Build failed, but attempting destroy anyway"
  fi

  echo "🚀 Running CDKTF destroy..."
  npm run cdktf:destroy || echo "No resources to destroy or destruction failed"

elif [ "$PLATFORM" = "cfn" ]; then
  echo "✅ CloudFormation project detected, running CloudFormation destroy..."
  npm run cfn:destroy || echo "No resources to destroy or destruction failed"
  
  # Clean up S3 bucket used for large template deployment (if exists)
  cfn_bucket="cfn-templates-localstack-${ENVIRONMENT_SUFFIX:-dev}"
  echo "🧹 Cleaning up template S3 bucket: $cfn_bucket"
  
  if [ -n "$AWS_ENDPOINT_URL" ]; then
    # LocalStack deployment - use awslocal for consistency with deploy script
    awslocal s3 rm "s3://${cfn_bucket}" --recursive 2>/dev/null || true
    awslocal s3 rb "s3://${cfn_bucket}" 2>/dev/null || true
  else
    # AWS deployment
    aws s3 rm "s3://${cfn_bucket}" --recursive 2>/dev/null || true
    aws s3 rb "s3://${cfn_bucket}" 2>/dev/null || true
  fi
  echo "✅ S3 bucket cleanup completed"

elif [ "$PLATFORM" = "tf" ]; then
  echo "✅ Terraform HCL project detected, running Terraform destroy..."
  
  if [ -n "$TERRAFORM_STATE_BUCKET" ]; then
    STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
    echo "Using state key: $STATE_KEY"
    
    cd lib
    export TF_INIT_OPTS="-backend-config=bucket=${TERRAFORM_STATE_BUCKET} \
        -backend-config=key=$STATE_KEY \
        -backend-config=region=${TERRAFORM_STATE_BUCKET_REGION} \
        -backend-config=encrypt=true \
        -backend-config=use_lockfile=true"
    terraform init -reconfigure -upgrade $TF_INIT_OPTS || echo "Terraform init failed"

    # Determine var-file to use based on metadata.json
    VAR_FILE=""
    if [ "$(jq -r '.subtask // ""' ../metadata.json)" = "IaC-Multi-Environment-Management" ]; then
      DEPLOY_ENV_FILE=$(jq -r '.task_config.deploy_env // ""' ../metadata.json)
      if [ -n "$DEPLOY_ENV_FILE" ]; then
        VAR_FILE="-var-file=${DEPLOY_ENV_FILE}"
        echo "Using var-file from metadata: ${DEPLOY_ENV_FILE}"
      fi
    fi

    terraform destroy -auto-approve $VAR_FILE || echo "No resources to destroy or destruction failed"
    cd ..
    
    echo "Cleaning up PR-specific state file..."
    aws s3 rm "s3://${TERRAFORM_STATE_BUCKET}/$STATE_KEY" || echo "State file not found or already cleaned up"
  else
    echo "⚠️ TERRAFORM_STATE_BUCKET not set, skipping Terraform destroy"
  fi

elif [ "$PLATFORM" = "pulumi" ]; then
  echo "✅ Pulumi project detected, running Pulumi destroy..."
  
  if [ "$LANGUAGE" = "go" ]; then
    echo "🔧 Go Pulumi project detected"
    cd lib
    echo "Selecting dev stack..."
    pulumi stack select "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --create || echo "Stack selection failed"
    echo "Destroying Pulumi infrastructure..."
    pulumi destroy --yes --refresh --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" || echo "No resources to destroy or destruction failed"
    echo "Removing Pulumi stack..."
    pulumi stack rm "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --yes --force || echo "Stack removal failed or stack doesn't exist"
    cd ..
  else
    echo "🔧 Python Pulumi project detected"
    echo "Selecting dev stack..."
    pipenv run pulumi-create-stack || echo "Stack selection failed"
    echo "Destroying Pulumi infrastructure..."
    pipenv run pulumi-destroy || echo "No resources to destroy or destruction failed"
    echo "Removing Pulumi stack..."
    pipenv run pulumi-remove-stack || echo "Stack removal failed or stack doesn't exist"
  fi

else
  echo "ℹ️ Platform '$PLATFORM' with language '$LANGUAGE' not supported for destruction, skipping destroy"
  echo "💡 Consider adding cleanup logic for $PLATFORM/$LANGUAGE projects here"
  exit 0
fi

echo "Destroy completed successfully"
