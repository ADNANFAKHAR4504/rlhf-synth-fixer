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

  # Force cleanup of orphaned resources that might not be tracked in state
  echo "🔧 Cleaning up any orphaned AWS resources..."

  # Temporarily disable exit-on-error for cleanup
  set +e

  # Get the environment suffix for resource names
  CLEANUP_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
  echo "Looking for orphaned resources with suffix: $CLEANUP_SUFFIX"

  # Check if this is a PR environment (pr followed by numbers)
  if [[ "$CLEANUP_SUFFIX" =~ ^pr[0-9]+$ ]]; then
    echo "PR environment detected, performing aggressive cleanup..."

    # Force delete RDS instances if they exist
    echo "  Checking for RDS instances..."
    for instance in "streamflix-aurora-instance-1-${CLEANUP_SUFFIX}" "streamflix-aurora-instance-2-${CLEANUP_SUFFIX}"; do
      if aws rds describe-db-instances --db-instance-identifier "$instance" --region eu-west-2 >/dev/null 2>&1; then
        echo "  ⚠️ Found orphaned RDS instance: $instance"
        echo "  🗑️ Deleting RDS instance: $instance"
        aws rds delete-db-instance --db-instance-identifier "$instance" --skip-final-snapshot --delete-automated-backups --region eu-west-2 >/dev/null 2>&1 || true
        echo "  ✅ Deletion initiated for: $instance"
      fi
    done

    # Force delete ElastiCache replication group
    echo "  Checking for ElastiCache replication group..."
    REDIS_GROUP="streamflix-redis-${CLEANUP_SUFFIX}"
    if aws elasticache describe-replication-groups --replication-group-id "$REDIS_GROUP" --region eu-west-2 >/dev/null 2>&1; then
      echo "  ⚠️ Found orphaned ElastiCache group: $REDIS_GROUP"
      echo "  🗑️ Deleting ElastiCache replication group: $REDIS_GROUP"
      aws elasticache delete-replication-group --replication-group-id "$REDIS_GROUP" --no-retain-primary-cluster --region eu-west-2 >/dev/null 2>&1 || true
      echo "  ✅ Deletion initiated for: $REDIS_GROUP"
    fi

    # Get EFS file system ID and delete mount targets
    echo "  Checking for EFS mount targets..."
    EFS_ID=$(aws efs describe-file-systems --region eu-west-2 --query "FileSystems[?Name=='streamflix-efs-${CLEANUP_SUFFIX}'].FileSystemId" --output text 2>/dev/null || echo "")
    if [ -n "$EFS_ID" ] && [ "$EFS_ID" != "None" ]; then
      echo "  ⚠️ Found EFS file system: $EFS_ID"
      # Get and delete all mount targets for this file system
      MOUNT_TARGETS=$(aws efs describe-mount-targets --file-system-id "$EFS_ID" --region eu-west-2 --query "MountTargets[].MountTargetId" --output text 2>/dev/null || echo "")
      if [ -n "$MOUNT_TARGETS" ]; then
        for mt in $MOUNT_TARGETS; do
          echo "  🗑️ Deleting mount target: $mt"
          aws efs delete-mount-target --mount-target-id "$mt" --region eu-west-2 >/dev/null 2>&1 || true
          echo "  ✅ Deletion initiated for mount target: $mt"
        done
      fi
    fi

    echo "⏳ Waiting 10 seconds for resources to be deleted..."
    sleep 10
  fi

  # Re-enable exit-on-error
  set -e

elif [ "$PLATFORM" = "cfn" ]; then
  echo "✅ CloudFormation project detected, running CloudFormation destroy..."
  npm run cfn:destroy || echo "No resources to destroy or destruction failed"

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

    npm run tf:destroy || echo "No resources to destroy or destruction failed"
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
