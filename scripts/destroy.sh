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
  
  echo "Step 1: Disable RDS deletion protection and delete instance: $DB_INSTANCE_NAME"
  # First disable deletion protection
  aws rds modify-db-instance --db-instance-identifier "$DB_INSTANCE_NAME" --no-deletion-protection --apply-immediately || echo "Failed to modify DB instance or not found"
  # Wait a moment for the modification to take effect
  sleep 10
  # Now delete the instance
  aws rds delete-db-instance --db-instance-identifier "$DB_INSTANCE_NAME" --skip-final-snapshot || echo "DB instance not found or already deleted"
  
  echo "Step 2: Wait for RDS instance deletion (checking for up to 5 minutes)..."
  for i in {1..60}; do
    if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_NAME" >/dev/null 2>&1; then
      echo "DB instance still exists, waiting... ($i/60) - 5s intervals"
      sleep 5
    else
      echo "✅ DB instance deleted successfully"
      break
    fi
  done
  
  # Final check - fail if DB still exists
  if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: DB instance still exists after 5 minutes. Manual intervention required."
    echo "❌ Cannot proceed with deployment until DB is fully deleted."
    exit 1
  fi
  
  echo "Step 3: Delete DB subnet group: $DB_SUBNET_GROUP_NAME"
  aws rds delete-db-subnet-group --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" || echo "DB subnet group not found or already deleted"
  
  # Verify DB subnet group is gone
  if aws rds describe-db-subnet-groups --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: DB subnet group still exists. Manual intervention required."
    exit 1
  else
    echo "✅ DB subnet group deleted successfully"
  fi
  
  echo "Step 4: Clean up IAM resources"
  # Remove role from instance profile first
  aws iam remove-role-from-instance-profile --instance-profile-name "$IAM_PROFILE_NAME" --role-name "$IAM_ROLE_NAME" || echo "Role not in instance profile or not found"
  
  # Delete instance profile
  aws iam delete-instance-profile --instance-profile-name "$IAM_PROFILE_NAME" || echo "Instance profile not found or already deleted"
  
  # List and detach all policies from role
  echo "Listing and detaching all policies from role: $IAM_ROLE_NAME"
  ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name "$IAM_ROLE_NAME" --query "AttachedPolicies[].PolicyArn" --output text 2>/dev/null || echo "")
  if [ -n "$ATTACHED_POLICIES" ]; then
    for policy in $ATTACHED_POLICIES; do
      echo "Detaching policy: $policy"
      aws iam detach-role-policy --role-name "$IAM_ROLE_NAME" --policy-arn "$policy" || echo "Failed to detach policy $policy"
    done
  else
    echo "No attached policies found or role does not exist"
  fi
  
  # List and delete inline policies
  echo "Listing and deleting inline policies from role: $IAM_ROLE_NAME"
  INLINE_POLICIES=$(aws iam list-role-policies --role-name "$IAM_ROLE_NAME" --query "PolicyNames" --output text 2>/dev/null || echo "")
  if [ -n "$INLINE_POLICIES" ]; then
    for policy in $INLINE_POLICIES; do
      echo "Deleting inline policy: $policy"
      aws iam delete-role-policy --role-name "$IAM_ROLE_NAME" --policy-name "$policy" || echo "Failed to delete inline policy $policy"
    done
  else
    echo "No inline policies found or role does not exist"
  fi
  
  # Delete role
  aws iam delete-role --role-name "$IAM_ROLE_NAME" || echo "IAM role not found or already deleted"
  
  # Verify IAM role is gone
  if aws iam get-role --role-name "$IAM_ROLE_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: IAM role still exists. Manual intervention required."
    exit 1
  else
    echo "✅ IAM role deleted successfully"
  fi
  
  echo "Step 5: Clean up Auto Scaling Groups"
  WEB_ASG_NAME="web-asg-us-east-1-${ENVIRONMENT_SUFFIX}"
  APP_ASG_NAME="app-asg-us-east-1-${ENVIRONMENT_SUFFIX}"
  
  echo "Deleting Auto Scaling Group: $WEB_ASG_NAME"
  aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$WEB_ASG_NAME" --force-delete || echo "Web ASG not found or already deleted"
  
  echo "Deleting Auto Scaling Group: $APP_ASG_NAME"
  aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$APP_ASG_NAME" --force-delete || echo "App ASG not found or already deleted"
  
  echo "Waiting for Auto Scaling Groups to delete (up to 10 minutes)..."
  ASG_DELETE_TIMEOUT=120  # 10 minutes at 5-second intervals
  
  for i in $(seq 1 $ASG_DELETE_TIMEOUT); do
    WEB_ASG_EXISTS=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$WEB_ASG_NAME" --query "AutoScalingGroups" --output text 2>/dev/null || echo "")
    APP_ASG_EXISTS=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$APP_ASG_NAME" --query "AutoScalingGroups" --output text 2>/dev/null || echo "")
    
    if [ -z "$WEB_ASG_EXISTS" ] && [ -z "$APP_ASG_EXISTS" ]; then
      echo "✅ Auto Scaling Groups deleted successfully"
      break
    else
      echo "ASGs still exist, waiting... ($i/$ASG_DELETE_TIMEOUT) - 5s intervals"
      sleep 5
    fi
  done
  
  # CRITICAL: Fail if ASGs still exist after timeout
  WEB_ASG_FINAL=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$WEB_ASG_NAME" --query "AutoScalingGroups" --output text 2>/dev/null || echo "")
  APP_ASG_FINAL=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$APP_ASG_NAME" --query "AutoScalingGroups" --output text 2>/dev/null || echo "")
  
  if [ -n "$WEB_ASG_FINAL" ] || [ -n "$APP_ASG_FINAL" ]; then
    echo "❌ CRITICAL: Auto Scaling Groups still exist after 10 minutes!"
    [ -n "$WEB_ASG_FINAL" ] && echo "❌ Web ASG still exists: $WEB_ASG_NAME"
    [ -n "$APP_ASG_FINAL" ] && echo "❌ App ASG still exists: $APP_ASG_NAME"
    echo "❌ Cannot proceed with deployment. Manual cleanup required."
    exit 1
  fi
  
  echo "Step 6: Clean up Load Balancer (must be first to free target groups)"
  ALB_ARN=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "None")
  if [ "$ALB_ARN" != "None" ] && [ "$ALB_ARN" != "null" ]; then
    echo "Deleting Load Balancer: $ALB_NAME"
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" || echo "Failed to delete load balancer"
    
    echo "Waiting for Load Balancer to be deleted..."
    for i in {1..24}; do
      ALB_CHECK=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "None")
      if [ "$ALB_CHECK" = "None" ] || [ "$ALB_CHECK" = "null" ]; then
        echo "✅ Load Balancer deleted successfully"
        break
      else
        echo "Load Balancer still exists, waiting... ($i/24) - 5s intervals"
        sleep 5
      fi
    done
  else
    echo "Load balancer not found or already deleted"
  fi
  
  echo "Step 7: Clean up Target Groups (now safe to delete)"
  WEB_TG_NAME="web-tg-us-east-1-${ENVIRONMENT_SUFFIX}"
  
  WEB_TG_ARN=$(aws elbv2 describe-target-groups --names "$WEB_TG_NAME" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "None")
  if [ "$WEB_TG_ARN" != "None" ] && [ "$WEB_TG_ARN" != "null" ]; then
    echo "Deleting Target Group: $WEB_TG_NAME"
    aws elbv2 delete-target-group --target-group-arn "$WEB_TG_ARN" || echo "Failed to delete target group"
  else
    echo "Target group not found or already deleted"
  fi
  
  echo "Step 8: Clean up CloudWatch Log Groups"
  WEB_LOG_GROUP="/migration/web/us-east-1-${ENVIRONMENT_SUFFIX}"
  APP_LOG_GROUP="/migration/app/us-east-1-${ENVIRONMENT_SUFFIX}"
  
  echo "Deleting CloudWatch Log Group: $WEB_LOG_GROUP"
  aws logs delete-log-group --log-group-name "$WEB_LOG_GROUP" || echo "Web log group not found or already deleted"
  
  echo "Deleting CloudWatch Log Group: $APP_LOG_GROUP"
  aws logs delete-log-group --log-group-name "$APP_LOG_GROUP" || echo "App log group not found or already deleted"
  
  echo "Step 9: Clean up Launch Templates"
  WEB_LT_NAME="web-lt-us-east-1-${ENVIRONMENT_SUFFIX}"
  APP_LT_NAME="app-lt-us-east-1-${ENVIRONMENT_SUFFIX}"
  
  echo "Deleting Launch Template: $WEB_LT_NAME"
  aws ec2 delete-launch-template --launch-template-name "$WEB_LT_NAME" || echo "Web launch template not found or already deleted"
  
  echo "Deleting Launch Template: $APP_LT_NAME"
  aws ec2 delete-launch-template --launch-template-name "$APP_LT_NAME" || echo "App launch template not found or already deleted"
  
  echo "Step 10: Final verification of critical resources"
  CRITICAL_ERRORS=0
  
  # Check if any critical resources still exist
  if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: DB instance still exists: $DB_INSTANCE_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if aws rds describe-db-subnet-groups --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: DB subnet group still exists: $DB_SUBNET_GROUP_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if aws iam get-role --role-name "$IAM_ROLE_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: IAM role still exists: $IAM_ROLE_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if aws ec2 describe-launch-templates --launch-template-names "$WEB_LT_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: Web Launch template still exists: $WEB_LT_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if aws ec2 describe-launch-templates --launch-template-names "$APP_LT_NAME" >/dev/null 2>&1; then
    echo "❌ CRITICAL: App Launch template still exists: $APP_LT_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check Auto Scaling Groups
  WEB_ASG_CHECK=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$WEB_ASG_NAME" --query "AutoScalingGroups" --output text 2>/dev/null || echo "")
  if [ -n "$WEB_ASG_CHECK" ]; then
    echo "❌ CRITICAL: Web Auto Scaling Group still exists: $WEB_ASG_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  APP_ASG_CHECK=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$APP_ASG_NAME" --query "AutoScalingGroups" --output text 2>/dev/null || echo "")
  if [ -n "$APP_ASG_CHECK" ]; then
    echo "❌ CRITICAL: App Auto Scaling Group still exists: $APP_ASG_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check Target Group
  TG_CHECK=$(aws elbv2 describe-target-groups --names "$WEB_TG_NAME" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "None")
  if [ "$TG_CHECK" != "None" ] && [ "$TG_CHECK" != "null" ]; then
    echo "❌ CRITICAL: Target Group still exists: $WEB_TG_NAME"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  # Check CloudWatch Log Groups
  if aws logs describe-log-groups --log-group-name-prefix "$WEB_LOG_GROUP" --query "logGroups[?logGroupName=='$WEB_LOG_GROUP']" --output text | grep -q .; then
    echo "❌ CRITICAL: Web Log Group still exists: $WEB_LOG_GROUP"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if aws logs describe-log-groups --log-group-name-prefix "$APP_LOG_GROUP" --query "logGroups[?logGroupName=='$APP_LOG_GROUP']" --output text | grep -q .; then
    echo "❌ CRITICAL: App Log Group still exists: $APP_LOG_GROUP"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
  fi
  
  if [ $CRITICAL_ERRORS -gt 0 ]; then
    echo "❌ DESTROY FAILED: $CRITICAL_ERRORS critical resources still exist"
    echo "❌ Cannot proceed with deployment. Manual cleanup required."
    exit 1
  else
    echo "✅ All critical resources successfully deleted"
  fi
  
  echo "Manual cleanup completed successfully"

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
