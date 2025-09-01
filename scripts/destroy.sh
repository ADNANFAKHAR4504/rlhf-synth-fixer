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
  # Try to destroy single stack first (new architecture)
  echo "🌍 Destroying single multi-region stack..."
  npx cdktf destroy TapStack$ENVIRONMENT_SUFFIX --auto-approve || echo "Single stack destroy failed or no resources"
  
  # Fallback: Destroy both stacks for backwards compatibility with old architecture
  echo "🌍 Destroying West region stack (fallback)..."
  npx cdktf destroy TapStackWest$ENVIRONMENT_SUFFIX --auto-approve || echo "West stack destroy failed or no resources"
  echo "🌍 Destroying East region stack (fallback)..."
  npx cdktf destroy TapStackEast$ENVIRONMENT_SUFFIX --auto-approve || echo "East stack destroy failed or no resources"
  
  echo "🧹 Manual cleanup of orphaned AWS resources..."
  # Clean up specific resources that might be orphaned in dependency order
  # East region resources
  DB_INSTANCE_EAST="tap-database-us-east-1-${ENVIRONMENT_SUFFIX}"
  DB_SUBNET_GROUP_EAST="tap-db-subnet-group-us-east-1-${ENVIRONMENT_SUFFIX}"
  LOG_GROUP_EAST="/aws/ec2/tap-log-group-us-east-1-${ENVIRONMENT_SUFFIX}"
  ASG_EAST="tap-asg-us-east-1-${ENVIRONMENT_SUFFIX}"
  
  # West region resources
  DB_INSTANCE_WEST="tap-database-us-west-2-${ENVIRONMENT_SUFFIX}"
  DB_SUBNET_GROUP_WEST="tap-db-subnet-group-us-west-2-${ENVIRONMENT_SUFFIX}"
  LOG_GROUP_WEST="/aws/ec2/tap-log-group-us-west-2-${ENVIRONMENT_SUFFIX}"
  ASG_WEST="tap-asg-us-west-2-${ENVIRONMENT_SUFFIX}"
  
  # Launch Templates
  LAUNCH_TEMPLATE_EAST="tap-lt-us-east-1-${ENVIRONMENT_SUFFIX}"
  LAUNCH_TEMPLATE_WEST="tap-lt-us-west-2-${ENVIRONMENT_SUFFIX}"
  
  # Application Load Balancers
  ALB_EAST="tap-alb-us-east-1-${ENVIRONMENT_SUFFIX}"
  ALB_WEST="tap-alb-us-west-2-${ENVIRONMENT_SUFFIX}"
  
  # Target Groups
  TARGET_GROUP_EAST="tap-tg-us-east-1-${ENVIRONMENT_SUFFIX}"
  TARGET_GROUP_WEST="tap-tg-us-west-2-${ENVIRONMENT_SUFFIX}"
  
  echo "Step 1: Clean up Application Load Balancers first (to free up dependencies)"
  echo "Deleting ALB: $ALB_EAST"
  ALB_ARN_EAST=$(aws elbv2 describe-load-balancers --names "$ALB_EAST" --region us-east-1 --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "None")
  if [ "$ALB_ARN_EAST" != "None" ] && [ "$ALB_ARN_EAST" != "null" ]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN_EAST" --region us-east-1 || echo "Failed to delete East ALB"
  fi
  
  echo "Deleting ALB: $ALB_WEST"
  ALB_ARN_WEST=$(aws elbv2 describe-load-balancers --names "$ALB_WEST" --region us-west-2 --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "None")
  if [ "$ALB_ARN_WEST" != "None" ] && [ "$ALB_ARN_WEST" != "null" ]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN_WEST" --region us-west-2 || echo "Failed to delete West ALB"
  fi
  
  # Wait a moment for ALB deletions to process
  echo "Waiting 30 seconds for ALB deletions to process..."
  sleep 30
  
  echo "Step 1.5: Clean up Target Groups (after ALB deletion)"
  echo "Deleting Target Group: $TARGET_GROUP_EAST"
  TG_ARN_EAST=$(aws elbv2 describe-target-groups --names "$TARGET_GROUP_EAST" --region us-east-1 --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "None")
  if [ "$TG_ARN_EAST" != "None" ] && [ "$TG_ARN_EAST" != "null" ]; then
    aws elbv2 delete-target-group --target-group-arn "$TG_ARN_EAST" --region us-east-1 || echo "Failed to delete East Target Group"
  fi
  
  echo "Deleting Target Group: $TARGET_GROUP_WEST"
  TG_ARN_WEST=$(aws elbv2 describe-target-groups --names "$TARGET_GROUP_WEST" --region us-west-2 --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "None")
  if [ "$TG_ARN_WEST" != "None" ] && [ "$TG_ARN_WEST" != "null" ]; then
    aws elbv2 delete-target-group --target-group-arn "$TG_ARN_WEST" --region us-west-2 || echo "Failed to delete West Target Group"
  fi
  
  echo "Step 2: Clean up CloudWatch Log Groups (no dependencies)"
  echo "Deleting CloudWatch Log Group: $LOG_GROUP_EAST"
  aws logs delete-log-group --log-group-name "$LOG_GROUP_EAST" --region us-east-1 || echo "East log group not found or already deleted"
  
  echo "Deleting CloudWatch Log Group: $LOG_GROUP_WEST"
  aws logs delete-log-group --log-group-name "$LOG_GROUP_WEST" --region us-west-2 || echo "West log group not found or already deleted"
  
  echo "Step 3: Clean up Auto Scaling Groups"
  echo "Deleting Auto Scaling Group: $ASG_EAST"
  aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$ASG_EAST" --force-delete --region us-east-1 || echo "East ASG not found or already deleted"
  
  echo "Deleting Auto Scaling Group: $ASG_WEST"
  aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$ASG_WEST" --force-delete --region us-west-2 || echo "West ASG not found or already deleted"
  
  echo "Step 4: Clean up Launch Templates"
  echo "Deleting Launch Template: $LAUNCH_TEMPLATE_EAST"
  aws ec2 delete-launch-template --launch-template-name "$LAUNCH_TEMPLATE_EAST" --region us-east-1 || echo "East launch template not found or already deleted"
  
  echo "Deleting Launch Template: $LAUNCH_TEMPLATE_WEST" 
  aws ec2 delete-launch-template --launch-template-name "$LAUNCH_TEMPLATE_WEST" --region us-west-2 || echo "West launch template not found or already deleted"
  
  echo "Step 5: Disable RDS deletion protection and delete instances"
  # East region database
  echo "Processing East region database: $DB_INSTANCE_EAST"
  aws rds modify-db-instance --db-instance-identifier "$DB_INSTANCE_EAST" --no-deletion-protection --apply-immediately --region us-east-1 || echo "Failed to modify East DB instance or not found"
  aws rds delete-db-instance --db-instance-identifier "$DB_INSTANCE_EAST" --skip-final-snapshot --region us-east-1 || echo "East DB instance not found or already deleted"
  
  # West region database  
  echo "Processing West region database: $DB_INSTANCE_WEST"
  aws rds modify-db-instance --db-instance-identifier "$DB_INSTANCE_WEST" --no-deletion-protection --apply-immediately --region us-west-2 || echo "Failed to modify West DB instance or not found"
  aws rds delete-db-instance --db-instance-identifier "$DB_INSTANCE_WEST" --skip-final-snapshot --region us-west-2 || echo "West DB instance not found or already deleted"
  
  echo "Step 6: Wait for RDS instance deletion (checking for up to 5 minutes)..."
  for i in {1..60}; do
    EAST_DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
    WEST_DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
    
    if [ "$EAST_DB_EXISTS" = "false" ] && [ "$WEST_DB_EXISTS" = "false" ]; then
      echo "✅ Both DB instances deleted successfully"
      break
    else
      echo "DB instances still exist (East: $EAST_DB_EXISTS, West: $WEST_DB_EXISTS), waiting... ($i/60) - 5s intervals"
      sleep 5
    fi
  done
  
  # Final check - fail if any DB still exists
  FINAL_EAST_DB=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
  FINAL_WEST_DB=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
  
  if [ "$FINAL_EAST_DB" = "true" ] || [ "$FINAL_WEST_DB" = "true" ]; then
    echo "❌ CRITICAL: DB instances still exist after 5 minutes (East: $FINAL_EAST_DB, West: $FINAL_WEST_DB)"
    echo "❌ Cannot proceed with deployment until all DBs are fully deleted."
    exit 1
  fi
  
  echo "Step 7: Delete DB subnet groups"
  echo "Deleting East DB subnet group: $DB_SUBNET_GROUP_EAST"
  aws rds delete-db-subnet-group --db-subnet-group-name "$DB_SUBNET_GROUP_EAST" --region us-east-1 || echo "East DB subnet group not found or already deleted"
  
  echo "Deleting West DB subnet group: $DB_SUBNET_GROUP_WEST"
  aws rds delete-db-subnet-group --db-subnet-group-name "$DB_SUBNET_GROUP_WEST" --region us-west-2 || echo "West DB subnet group not found or already deleted"
  
  echo "Step 8: Final verification of critical resources"
  CRITICAL_ERRORS=0
  
  # Check CloudWatch Log Groups
  EAST_LOG_CHECK=$(aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP_EAST" --region us-east-1 --query "logGroups[?logGroupName=='$LOG_GROUP_EAST']" --output text 2>/dev/null || echo "")
  WEST_LOG_CHECK=$(aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP_WEST" --region us-west-2 --query "logGroups[?logGroupName=='$LOG_GROUP_WEST']" --output text 2>/dev/null || echo "")
  
  if [ -n "$EAST_LOG_CHECK" ]; then
    echo "❌ CRITICAL: East CloudWatch Log Group still exists: $LOG_GROUP_EAST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ -n "$WEST_LOG_CHECK" ]; then
    echo "❌ CRITICAL: West CloudWatch Log Group still exists: $LOG_GROUP_WEST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check DB Subnet Groups
  EAST_SUBNET_CHECK=$(aws rds describe-db-subnet-groups --db-subnet-group-name "$DB_SUBNET_GROUP_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
  WEST_SUBNET_CHECK=$(aws rds describe-db-subnet-groups --db-subnet-group-name "$DB_SUBNET_GROUP_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
  
  if [ "$EAST_SUBNET_CHECK" = "true" ]; then
    echo "❌ CRITICAL: East DB subnet group still exists: $DB_SUBNET_GROUP_EAST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ "$WEST_SUBNET_CHECK" = "true" ]; then
    echo "❌ CRITICAL: West DB subnet group still exists: $DB_SUBNET_GROUP_WEST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check Launch Templates
  EAST_LT_CHECK=$(aws ec2 describe-launch-templates --launch-template-names "$LAUNCH_TEMPLATE_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
  WEST_LT_CHECK=$(aws ec2 describe-launch-templates --launch-template-names "$LAUNCH_TEMPLATE_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
  
  if [ "$EAST_LT_CHECK" = "true" ]; then
    echo "❌ CRITICAL: East Launch Template still exists: $LAUNCH_TEMPLATE_EAST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ "$WEST_LT_CHECK" = "true" ]; then
    echo "❌ CRITICAL: West Launch Template still exists: $LAUNCH_TEMPLATE_WEST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check Application Load Balancers
  EAST_ALB_CHECK=$(aws elbv2 describe-load-balancers --names "$ALB_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
  WEST_ALB_CHECK=$(aws elbv2 describe-load-balancers --names "$ALB_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
  
  if [ "$EAST_ALB_CHECK" = "true" ]; then
    echo "❌ CRITICAL: East ALB still exists: $ALB_EAST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ "$WEST_ALB_CHECK" = "true" ]; then
    echo "❌ CRITICAL: West ALB still exists: $ALB_WEST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check Target Groups
  EAST_TG_CHECK=$(aws elbv2 describe-target-groups --names "$TARGET_GROUP_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
  WEST_TG_CHECK=$(aws elbv2 describe-target-groups --names "$TARGET_GROUP_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
  
  if [ "$EAST_TG_CHECK" = "true" ]; then
    echo "❌ CRITICAL: East Target Group still exists: $TARGET_GROUP_EAST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ "$WEST_TG_CHECK" = "true" ]; then
    echo "❌ CRITICAL: West Target Group still exists: $TARGET_GROUP_WEST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check DB instances (should be deleted by now)
  FINAL_EAST_DB_CHECK=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_EAST" --region us-east-1 >/dev/null 2>&1 && echo "true" || echo "false")
  FINAL_WEST_DB_CHECK=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_WEST" --region us-west-2 >/dev/null 2>&1 && echo "true" || echo "false")
  
  if [ "$FINAL_EAST_DB_CHECK" = "true" ]; then
    echo "❌ CRITICAL: East DB instance still exists: $DB_INSTANCE_EAST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ "$FINAL_WEST_DB_CHECK" = "true" ]; then
    echo "❌ CRITICAL: West DB instance still exists: $DB_INSTANCE_WEST"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ $CRITICAL_ERRORS -gt 0 ]; then
    echo "❌ DESTROY FAILED: $CRITICAL_ERRORS critical resources still exist"
    echo "❌ Cannot proceed with deployment. Manual cleanup required."
    exit 1
  else
    echo "✅ All critical resources successfully deleted"
    echo "✅ Manual cleanup completed successfully - ready for deployment"
  fi

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
