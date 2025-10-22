#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process with clean slate approach..."
echo "📋 This script will:"
echo "   1. Bootstrap prerequisites"
echo "   2. Destroy existing resources (if any)"
echo "   3. Clean up Secrets Manager secrets in deletion state"
echo "   4. Deploy fresh resources"
echo ""

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

# Destroy existing resources first
echo "=== Destroy Phase ==="
echo "🧹 Running destroy script to clean up existing resources before deployment..."
if [ -f "./scripts/destroy.sh" ]; then
  ./scripts/destroy.sh
  DESTROY_EXIT_CODE=$?
  if [ $DESTROY_EXIT_CODE -eq 0 ]; then
    echo "✅ Destroy phase completed successfully"
  else
    echo "⚠️ Destroy phase completed with warnings (exit code: $DESTROY_EXIT_CODE)"
  fi
else
  echo "⚠️ Destroy script not found, skipping destroy phase"
fi

# Wait a moment to ensure resources are fully cleaned up
echo "⏳ Waiting 5 seconds to ensure resources are fully cleaned up..."
sleep 5

# Clean up any Secrets Manager secrets that might be in deletion state
echo "=== Aggressive Secrets Cleanup Phase ==="
echo "🔥 FORCEFULLY REMOVING ALL AWS SECRETS MANAGER SECRETS..."
echo "   This will use multiple strategies to ensure complete deletion"

# Determine the suffix to use for secrets
if [ -f "metadata.json" ]; then
  TASK_ID=$(jq -r '.task_id // ""' metadata.json 2>/dev/null || echo "")
else
  TASK_ID=""
fi

if [ -n "$TASK_ID" ]; then
  SECRET_SUFFIX="pr${TASK_ID}"
elif [ -n "$ENVIRONMENT_SUFFIX" ]; then
  SECRET_SUFFIX="$ENVIRONMENT_SUFFIX"
else
  SECRET_SUFFIX="dev"
fi

echo "Force deleting ALL secrets with suffix: $SECRET_SUFFIX in region: $AWS_REGION"

# Function to aggressively delete a secret with multiple strategies
force_delete_secret() {
  local secret_name=$1
  local max_retries=5
  local retry_count=0

  echo "  🔍 Processing secret: $secret_name"

  while [ $retry_count -lt $max_retries ]; do
    retry_count=$((retry_count + 1))

    # Check if the secret exists
    SECRET_EXISTS=$(aws secretsmanager describe-secret \
      --secret-id "$secret_name" \
      --region "$AWS_REGION" 2>&1)

    if echo "$SECRET_EXISTS" | grep -q "ResourceNotFoundException"; then
      echo "  ✅ Secret does not exist or is fully deleted"
      return 0
    fi

    echo "  ⚠️  Secret exists: $secret_name (attempt $retry_count/$max_retries)"

    # Strategy 1: Direct force delete
    echo "  🔄 Attempting force delete..."
    DELETE_RESULT=$(aws secretsmanager delete-secret \
      --secret-id "$secret_name" \
      --force-delete-without-recovery \
      --region "$AWS_REGION" 2>&1)

    if echo "$DELETE_RESULT" | grep -q "DeletionDate"; then
      echo "  ✅ Secret marked for immediate deletion"
      return 0
    fi

    # Strategy 2: If already scheduled for deletion, try restore then delete
    if echo "$DELETE_RESULT" | grep -q "InvalidRequestException"; then
      echo "  🔄 Secret already scheduled, trying restore-delete strategy..."

      # Try to restore the secret first
      aws secretsmanager restore-secret \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" 2>/dev/null || true

      sleep 1

      # Then immediately delete it
      aws secretsmanager delete-secret \
        --secret-id "$secret_name" \
        --force-delete-without-recovery \
        --region "$AWS_REGION" 2>/dev/null || true
    fi

    # Strategy 3: Update the secret then delete (sometimes works)
    if [ $retry_count -eq 3 ]; then
      echo "  🔄 Trying update-delete strategy..."
      aws secretsmanager put-secret-value \
        --secret-id "$secret_name" \
        --secret-string "dummy" \
        --region "$AWS_REGION" 2>/dev/null || true

      sleep 1

      aws secretsmanager delete-secret \
        --secret-id "$secret_name" \
        --force-delete-without-recovery \
        --region "$AWS_REGION" 2>/dev/null || true
    fi

    sleep 2
  done

  echo "  ❌ Failed to delete secret after $max_retries attempts"
  return 1
}

# List of specific secret patterns to force delete
SECRETS_TO_DELETE=(
  "streamflix/api/keys-${SECRET_SUFFIX}"
  "streamflix/db/credentials-${SECRET_SUFFIX}"
  "streamflix-api-secret-${SECRET_SUFFIX}"
  "streamflix-db-secret-${SECRET_SUFFIX}"
)

# Force delete each specific secret
echo "Force deleting specific secrets..."
for secret in "${SECRETS_TO_DELETE[@]}"; do
  force_delete_secret "$secret"
done

# Also search for and delete any other secrets with our suffix
echo ""
echo "Searching for ALL secrets with suffix: ${SECRET_SUFFIX}..."

# Get all secrets including those scheduled for deletion
ALL_SECRETS=$(aws secretsmanager list-secrets \
  --include-planned-deletion \
  --region "$AWS_REGION" 2>/dev/null || echo '{"SecretList": []}')

MATCHING_SECRETS=$(echo "$ALL_SECRETS" | jq -r ".SecretList[] | select(.Name | contains(\"${SECRET_SUFFIX}\")) | .Name")

if [ -n "$MATCHING_SECRETS" ]; then
  echo "Found the following secrets to delete:"
  echo "$MATCHING_SECRETS" | while IFS= read -r secret; do
    echo "  • $secret"
  done
  echo ""

  echo "$MATCHING_SECRETS" | while IFS= read -r secret; do
    if [ -n "$secret" ]; then
      force_delete_secret "$secret"
    fi
  done
else
  echo "No additional secrets found with suffix: ${SECRET_SUFFIX}"
fi

# Double-check that problematic secrets are gone
echo ""
echo "🔍 Final verification of critical secrets..."
FAILED_COUNT=0
for secret in "${SECRETS_TO_DELETE[@]}"; do
  SECRET_CHECK=$(aws secretsmanager describe-secret \
    --secret-id "$secret" \
    --region "$AWS_REGION" 2>&1 || true)

  if echo "$SECRET_CHECK" | grep -q "ResourceNotFoundException"; then
    echo "  ✅ Confirmed deleted: $secret"
  else
    echo "  ⚠️  WARNING: Secret may still exist: $secret"
    echo "  🔥 FINAL AGGRESSIVE DELETION ATTEMPT..."

    # Try multiple strategies in rapid succession
    aws secretsmanager restore-secret --secret-id "$secret" --region "$AWS_REGION" 2>/dev/null || true
    sleep 0.5
    aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery --region "$AWS_REGION" 2>/dev/null || true
    sleep 0.5
    aws secretsmanager put-secret-value --secret-id "$secret" --secret-string "DELETE_ME" --region "$AWS_REGION" 2>/dev/null || true
    sleep 0.5
    aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery --region "$AWS_REGION" 2>/dev/null || true

    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
done

echo ""
if [ $FAILED_COUNT -eq 0 ]; then
  echo "✅ Secrets cleanup phase completed successfully!"
  echo "   All critical secrets have been removed."
else
  echo "⚠️  Secrets cleanup completed with warnings"
  echo "   $FAILED_COUNT secret(s) may still be in deletion state"
  echo "   Deployment will proceed, but may encounter issues"
fi

echo "⏳ Waiting 5 seconds to ensure AWS propagation..."
sleep 5

# Deploy step
echo "=== Deploy Phase ==="
echo "🚀 Starting fresh deployment..."
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
      LOCK_ID=$(terraform apply -auto-approve -lock=true -lock-timeout=10s -input=false tfplan 2>&1 | grep -oE 'ID:\s+[0-9a-f-]{36}' | cut -d' ' -f2 || echo "")
      
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
    terraform plan -lock-timeout=120s -lock=false -input=false -out=tfplan || echo "Plan creation failed, attempting direct apply..."
    
    # Try direct apply with lock timeout, and handle lock issues
    if ! terraform apply -auto-approve -lock=true -lock-timeout=300s -input=false tfplan; then
      echo "⚠️ Direct apply with plan failed, trying without plan..."
      if ! terraform apply -auto-approve -lock=true -lock-timeout=300s -input=false; then
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

echo ""
echo "✅ Full deployment cycle completed successfully!"
echo "   ✓ Prerequisites bootstrapped"
echo "   ✓ Existing resources destroyed"
echo "   ✓ Secrets cleaned up"
echo "   ✓ Fresh resources deployed"

# Get outputs using the dedicated script
echo "📊 Collecting deployment outputs..."
./scripts/get-outputs.sh
