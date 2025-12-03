#!/bin/bash

# Exit on any error
set -e

echo "🚀 Bootstrapping infrastructure..."

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
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}
export PULUMI_BACKEND_URL=${PULUMI_BACKEND_URL:-}
export PULUMI_ORG=${PULUMI_ORG:-organization}
export PULUMI_CONFIG_PASSPHRASE=${PULUMI_CONFIG_PASSPHRASE:-}

# Provide non-interactive defaults for TF variables if not set (CI safe)
export TF_VAR_db_username=${TF_VAR_db_username:-temp_admin}
export TF_VAR_db_password=${TF_VAR_db_password:-TempPassword123!}

echo "Environment configuration:"
echo "  Environment suffix: $ENVIRONMENT_SUFFIX"
echo "  Repository: $REPOSITORY"
echo "  Commit author: $COMMIT_AUTHOR"

echo "Using TF_VAR_db_username: (set)"
echo "Using TF_VAR_db_password: (set)"

if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK bootstrap..."
  export CURRENT_ACCOUNT_ID=${CURRENT_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}

  # Define all target regions
  REGIONS=("us-east-1" "us-west-2" "ap-southeast-2" "eu-central-1" "eu-central-2" "eu-west-2")

  echo "🏗️ Bootstrapping Account: $CURRENT_ACCOUNT_ID"
  echo "Regions: ${REGIONS[*]}"

  for REGION in "${REGIONS[@]}"; do
    if aws cloudformation describe-stacks --stack-name CDKToolkit --region "$REGION" >/dev/null 2>&1; then
      echo "✅ CDKToolkit exists in $REGION — skipping bootstrap."
    else
      echo "🚀 Bootstrapping $REGION..."
      npx cdk bootstrap aws://$CURRENT_ACCOUNT_ID/$REGION \
        --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
        --require-approval never
    fi
  done

  echo "✅ All target regions checked and bootstrapped where needed."
  # npm run cdk:bootstrap

elif [ "$PLATFORM" = "pulumi" ]; then
  echo "✅ Pulumi project detected, setting up environment..."
  
  if [ -z "$PULUMI_BACKEND_URL" ]; then
    echo "❌ PULUMI_BACKEND_URL environment variable is required for Pulumi projects"
    exit 1
  fi
  
  echo "Pulumi backend URL: $PULUMI_BACKEND_URL"
  echo "Pulumi organization: $PULUMI_ORG"
  
  # Login to Pulumi S3 backend
  pipenv run pulumi-login
  echo "✅ Pulumi bootstrap completed"

elif [ "$PLATFORM" = "tf" ]; then
  echo "✅ Terraform project detected, setting up environment..."
  
  if [ -z "$TERRAFORM_STATE_BUCKET" ]; then
    echo "❌ TERRAFORM_STATE_BUCKET environment variable is required for Terraform projects"
    exit 1
  fi
  
  echo "Terraform state bucket: $TERRAFORM_STATE_BUCKET"
  echo "Terraform state bucket region: $TERRAFORM_STATE_BUCKET_REGION"
  
  # Set up PR-specific state management
  STATE_KEY="prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"
  echo "Using state key: $STATE_KEY"
  
  cd lib
  
  # Set up backend configuration with PR-specific settings
  export TF_INIT_OPTS="-backend-config=bucket=${TERRAFORM_STATE_BUCKET} \
      -backend-config=key=$STATE_KEY \
      -backend-config=region=${TERRAFORM_STATE_BUCKET_REGION} \
      -backend-config=encrypt=true"

  
  # Initialize Terraform (no fallback init without backend)
  echo "Initializing Terraform with PR-specific backend..."
  echo "TF_INIT_OPTS: $TF_INIT_OPTS"
  terraform init -reconfigure -upgrade $TF_INIT_OPTS
  
  # Check if state file exists
  echo "Checking if Terraform state file exists..."
  if aws s3 ls "s3://${TERRAFORM_STATE_BUCKET}/$STATE_KEY" >/dev/null 2>&1; then
    echo "✅ State file exists"
  else
    echo "State file does not exist yet. This is normal for new environments."
    echo "Creating empty state file..."
    echo '{"version": 4, "terraform_version": "1.0.0", "serial": 1, "lineage": "", "outputs": {}, "resources": []}' | \
      aws s3 cp - "s3://${TERRAFORM_STATE_BUCKET}/$STATE_KEY" || \
      echo "Could not create state file, continuing..."
  fi
  
  # Run terraform plan
  echo "Running Terraform plan..."
  # If task_sub_category indicates multi-env mgmt, read deploy_env from metadata.json
  # and pass it as -var-file to terraform plan via TF_CLI_ARGS_plan
  if [ "$(jq -r '.subtask // ""' ../metadata.json)" = "IaC-Multi-Environment-Management" ]; then
    DEPLOY_ENV_FILE=$(jq -r '.task_config.deploy_env // ""' ../metadata.json)
    if [ -n "$DEPLOY_ENV_FILE" ]; then
      export TF_CLI_ARGS_plan="-var-file=${DEPLOY_ENV_FILE} ${TF_CLI_ARGS_plan:-}"
      echo "Using metadata var-file: ${DEPLOY_ENV_FILE}"
      cd .. && npm run tf:plan -var-file=${DEPLOY_ENV_FILE} --silent
    fi
  else
    if (cd .. && npm run tf:plan --silent); then
      echo "✅ Terraform plan succeeded"
    else
      echo "⚠️ Terraform plan failed, but continuing..."
    fi
  fi
  
  
  # Verify the plan was created
  if [ -f "tfplan" ]; then
    echo "✅ Terraform plan file created successfully"
  else
    echo "⚠️ Terraform plan file not found, but continuing..."
  fi
  
  cd ..
  echo "✅ Terraform bootstrap completed"

elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, no specific bootstrap required"
  echo "ℹ️ CDKTF bootstrapping will be handled during synthesis"

elif [ "$PLATFORM" = "cfn" ]; then
  echo "✅ CloudFormation project detected, no specific bootstrap required"
  echo "ℹ️ CloudFormation does not require bootstrapping"

else
  echo "ℹ️ Unknown or unsupported platform: $PLATFORM. Skipping bootstrap."
fi

echo "✅ Bootstrap completed successfully"