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
  
  echo "🧹 Manual cleanup of orphaned AWS resources..."
  # Clean up specific resources that might be orphaned in dependency order
  DB_INSTANCE_NAME="migration-primary-db-us-east-1-${ENVIRONMENT_SUFFIX}"
  DB_SUBNET_GROUP_NAME="migration-db-subnet-group-us-east-1-${ENVIRONMENT_SUFFIX}"
  IAM_ROLE_NAME="ec2-migration-role-us-east-1-${ENVIRONMENT_SUFFIX}"
  IAM_PROFILE_NAME="ec2-migration-profile-us-east-1-${ENVIRONMENT_SUFFIX}"
  ALB_NAME="migration-alb-us-east-1-${ENVIRONMENT_SUFFIX}"
  
  echo "Step 1: Delete RDS Database Instance: $DB_INSTANCE_NAME"
  aws rds delete-db-instance --db-instance-identifier "$DB_INSTANCE_NAME" --skip-final-snapshot || echo "DB instance not found or already deleted"
  
  echo "Step 2: Wait for RDS instance deletion (checking for 60 seconds)..."
  for i in {1..12}; do
    if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_NAME" >/dev/null 2>&1; then
      echo "DB instance still exists, waiting... ($i/12)"
      sleep 5
    else
      echo "DB instance deleted"
      break
    fi
  done
  
  echo "Step 3: Delete DB subnet group: $DB_SUBNET_GROUP_NAME"
  aws rds delete-db-subnet-group --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" || echo "DB subnet group not found or already deleted"
  
  echo "Step 4: Clean up IAM resources"
  # Remove role from instance profile first
  aws iam remove-role-from-instance-profile --instance-profile-name "$IAM_PROFILE_NAME" --role-name "$IAM_ROLE_NAME" || echo "Role not in instance profile or not found"
  
  # Delete instance profile
  aws iam delete-instance-profile --instance-profile-name "$IAM_PROFILE_NAME" || echo "Instance profile not found or already deleted"
  
  # Detach policies from role
  aws iam detach-role-policy --role-name "$IAM_ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" || echo "Policy not attached or role not found"
  
  # Delete role
  aws iam delete-role --role-name "$IAM_ROLE_NAME" || echo "IAM role not found or already deleted"
  
  echo "Step 5: Clean up Load Balancer"
  ALB_ARN=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "None")
  if [ "$ALB_ARN" != "None" ] && [ "$ALB_ARN" != "null" ]; then
    echo "Deleting Load Balancer: $ALB_NAME"
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" || echo "Failed to delete load balancer"
  else
    echo "Load balancer not found or already deleted"
  fi
  
  echo "Manual cleanup completed"

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
