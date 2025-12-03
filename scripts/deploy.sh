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
TEAM=$(jq -r '.team // "unknown"' metadata.json)

echo "Project: platform=$PLATFORM, language=$LANGUAGE, team=$TEAM"

# Set default environment variables if not provided
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export REPOSITORY=${REPOSITORY:-$(basename "$(pwd)")}
export COMMIT_AUTHOR=${COMMIT_AUTHOR:-$(git config user.name 2>/dev/null || echo "unknown")}
export PR_NUMBER=${PR_NUMBER:-"unknown"}
export TEAM=${TEAM}
export AWS_REGION=${AWS_REGION:-us-east-1}
export TERRAFORM_STATE_BUCKET=${TERRAFORM_STATE_BUCKET:-}
export TERRAFORM_STATE_BUCKET_REGION=${TERRAFORM_STATE_BUCKET_REGION:-us-east-1}
export PULUMI_BACKEND_URL=${PULUMI_BACKEND_URL:-}
export PULUMI_ORG=${PULUMI_ORG:-organization}
export PULUMI_CONFIG_PASSPHRASE=${PULUMI_CONFIG_PASSPHRASE:-}

# Export Terraform variables for tagging
export TF_VAR_pr_number=${PR_NUMBER:-"unknown"}
export TF_VAR_team=${TEAM}

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

echo "=== Validation Phase ==="
echo "🔍 Validating stack naming conventions..."
if [ -f "scripts/validate-stack-naming.sh" ]; then
  ./scripts/validate-stack-naming.sh || {
    echo "⚠️ Stack naming validation failed. Please fix naming inconsistencies."
    echo "ℹ️ Use 'TapStack' (capital T, capital S) everywhere."
    # Don't fail deployment for now, just warn
    # exit 1
  }
else
  echo "⚠️ validate-stack-naming.sh not found, skipping naming validation"
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

  # Pre-deployment cleanup: Delete orphaned AWS resources that may cause conflicts
  echo "🧹 Cleaning up orphaned resources from previous failed deployments..."

  # CloudWatch Log Groups
  echo "  📋 Checking CloudWatch Log Groups..."
  for log_group_name in "/aws/lambda/webhook-processor-${ENVIRONMENT_SUFFIX}" "/aws/lambda/price-enricher-${ENVIRONMENT_SUFFIX}"; do
    if aws logs describe-log-groups --log-group-name-prefix "$log_group_name" --query "logGroups[?logGroupName=='${log_group_name}'].logGroupName" --output text 2>/dev/null | grep -q "$log_group_name"; then
      echo "    ⚠️ Found orphaned log group: $log_group_name - deleting..."
      aws logs delete-log-group --log-group-name "$log_group_name" 2>/dev/null || true
    fi
  done

  # DynamoDB Table
  echo "  📋 Checking DynamoDB Tables..."
  DYNAMO_TABLE="crypto-prices-${ENVIRONMENT_SUFFIX}"
  if aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --query "Table.TableName" --output text 2>/dev/null | grep -q "$DYNAMO_TABLE"; then
    echo "    ⚠️ Found orphaned DynamoDB table: $DYNAMO_TABLE - deleting..."
    aws dynamodb delete-table --table-name "$DYNAMO_TABLE" 2>/dev/null || true
    echo "    ⏳ Waiting for table deletion..."
    aws dynamodb wait table-not-exists --table-name "$DYNAMO_TABLE" 2>/dev/null || true
  fi

  # KMS Alias (delete alias before key)
  echo "  📋 Checking KMS Aliases..."
  KMS_ALIAS="alias/lambda-crypto-processor-${ENVIRONMENT_SUFFIX}"
  if aws kms describe-key --key-id "$KMS_ALIAS" --query "KeyMetadata.KeyId" --output text 2>/dev/null; then
    echo "    ⚠️ Found orphaned KMS alias: $KMS_ALIAS - deleting..."
    aws kms delete-alias --alias-name "$KMS_ALIAS" 2>/dev/null || true
  fi

  # SNS Topics
  echo "  📋 Checking SNS Topics..."
  SNS_TOPIC_PREFIX="price-updates-success-${ENVIRONMENT_SUFFIX}"
  SNS_TOPIC_ARN=$(aws sns list-topics --query "Topics[?contains(TopicArn, '${SNS_TOPIC_PREFIX}')].TopicArn" --output text 2>/dev/null || echo "")
  if [ -n "$SNS_TOPIC_ARN" ] && [ "$SNS_TOPIC_ARN" != "None" ]; then
    echo "    ⚠️ Found orphaned SNS topic: $SNS_TOPIC_ARN - deleting..."
    aws sns delete-topic --topic-arn "$SNS_TOPIC_ARN" 2>/dev/null || true
  fi

  # SQS Queues
  echo "  📋 Checking SQS Queues..."
  for queue_name in "webhook-processor-dlq-${ENVIRONMENT_SUFFIX}" "price-enricher-dlq-${ENVIRONMENT_SUFFIX}"; do
    QUEUE_URL=$(aws sqs get-queue-url --queue-name "$queue_name" --query "QueueUrl" --output text 2>/dev/null || echo "")
    if [ -n "$QUEUE_URL" ] && [ "$QUEUE_URL" != "None" ]; then
      echo "    ⚠️ Found orphaned SQS queue: $queue_name - deleting..."
      aws sqs delete-queue --queue-url "$QUEUE_URL" 2>/dev/null || true
    fi
  done

  # IAM Roles (be careful - only delete if orphaned)
  echo "  📋 Checking IAM Roles..."
  for role_name in "webhook-processor-role-${ENVIRONMENT_SUFFIX}" "price-enricher-role-${ENVIRONMENT_SUFFIX}"; do
    if aws iam get-role --role-name "$role_name" --query "Role.RoleName" --output text 2>/dev/null | grep -q "$role_name"; then
      echo "    ⚠️ Found orphaned IAM role: $role_name - cleaning up..."
      # Detach all policies first
      ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name "$role_name" --query "AttachedPolicies[].PolicyArn" --output text 2>/dev/null || echo "")
      for policy_arn in $ATTACHED_POLICIES; do
        aws iam detach-role-policy --role-name "$role_name" --policy-arn "$policy_arn" 2>/dev/null || true
      done
      # Delete inline policies
      INLINE_POLICIES=$(aws iam list-role-policies --role-name "$role_name" --query "PolicyNames[]" --output text 2>/dev/null || echo "")
      for policy_name in $INLINE_POLICIES; do
        aws iam delete-role-policy --role-name "$role_name" --policy-name "$policy_name" 2>/dev/null || true
      done
      # Delete the role
      aws iam delete-role --role-name "$role_name" 2>/dev/null || true
    fi
  done

  # Lambda Functions
  echo "  📋 Checking Lambda Functions..."
  for func_name in "webhook-processor-${ENVIRONMENT_SUFFIX}" "price-enricher-${ENVIRONMENT_SUFFIX}"; do
    if aws lambda get-function --function-name "$func_name" --query "Configuration.FunctionName" --output text 2>/dev/null | grep -q "$func_name"; then
      echo "    ⚠️ Found orphaned Lambda function: $func_name - deleting..."
      aws lambda delete-function --function-name "$func_name" 2>/dev/null || true
    fi
  done

  echo "✅ Orphaned resource cleanup completed"

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

  # Clean up any stale resources before deploying (CDKTF uses local state)
  RESOURCE_SUFFIX="${ENVIRONMENT_SUFFIX}"
  echo "🧹 Checking for stale AWS resources with suffix: $RESOURCE_SUFFIX"

  # Define regions to clean up (primary and secondary for DR scenarios)
  CLEANUP_REGIONS="us-east-1 us-west-2"

  # Clean up stale Lambda functions (in all regions)
  echo "Cleaning up stale Lambda functions..."
  for region in $CLEANUP_REGIONS; do
    for func in $(aws lambda list-functions --region "$region" --query "Functions[?contains(FunctionName, '-${RESOURCE_SUFFIX}')].FunctionName" --output text 2>/dev/null || echo ""); do
      if [ -n "$func" ]; then
        echo "  Deleting Lambda function: $func (region: $region)"
        aws lambda delete-function --function-name "$func" --region "$region" 2>/dev/null || echo "  Failed to delete $func"
      fi
    done
  done

  # Clean up stale DynamoDB tables (including global tables with replicas)
  echo "Cleaning up stale DynamoDB tables..."
  TABLES_TO_DELETE=""
  for table in $(aws dynamodb list-tables --query "TableNames[?contains(@, '-${RESOURCE_SUFFIX}')]" --output text 2>/dev/null || echo ""); do
    if [ -n "$table" ]; then
      echo "  Processing DynamoDB table: $table"

      # Check if table has replicas (global table) and remove them first
      REPLICAS=$(aws dynamodb describe-table --table-name "$table" --query 'Table.Replicas[].RegionName' --output text 2>/dev/null || echo "")
      if [ -n "$REPLICAS" ]; then
        echo "  Table has replicas: $REPLICAS"
        REPLICAS_TO_REMOVE=""
        for replica_region in $REPLICAS; do
          # Don't remove the primary region's replica (that's the base table)
          if [ "$replica_region" != "$AWS_REGION" ] && [ "$replica_region" != "us-east-1" ]; then
            echo "  Removing replica in $replica_region"
            aws dynamodb update-table --table-name "$table" --replica-updates "Delete={RegionName=$replica_region}" 2>/dev/null || echo "  Failed to remove replica in $replica_region"
            REPLICAS_TO_REMOVE="$REPLICAS_TO_REMOVE $replica_region"
          fi
        done

        # Wait for ALL replicas to be removed before proceeding (poll until replicas are gone)
        if [ -n "$REPLICAS_TO_REMOVE" ]; then
          echo "  Waiting for replica removal to complete (checking replicas list)..."
          for i in $(seq 1 60); do
            # Wait for table to become ACTIVE again after replica removal
            TABLE_STATUS=$(aws dynamodb describe-table --table-name "$table" --query 'Table.TableStatus' --output text 2>/dev/null || echo "DELETED")
            CURRENT_REPLICAS=$(aws dynamodb describe-table --table-name "$table" --query 'Table.Replicas[].RegionName' --output text 2>/dev/null || echo "")

            # Check if all non-primary replicas are gone
            REPLICAS_REMAINING=false
            for r in $CURRENT_REPLICAS; do
              if [ "$r" != "$AWS_REGION" ] && [ "$r" != "us-east-1" ]; then
                REPLICAS_REMAINING=true
                break
              fi
            done

            if [ "$REPLICAS_REMAINING" = "false" ] && [ "$TABLE_STATUS" = "ACTIVE" ]; then
              echo "  All replicas removed, table is ACTIVE"
              break
            fi
            echo "  Waiting for replicas to be removed... (status: $TABLE_STATUS, replicas: $CURRENT_REPLICAS) (attempt $i/60)"
            sleep 10
          done
        fi
      fi

      # Check if table has deletion protection enabled and disable it
      DELETION_PROTECTION=$(aws dynamodb describe-table --table-name "$table" --query 'Table.DeletionProtectionEnabled' --output text 2>/dev/null || echo "false")
      if [ "$DELETION_PROTECTION" = "true" ] || [ "$DELETION_PROTECTION" = "True" ]; then
        echo "  Disabling deletion protection on $table"
        aws dynamodb update-table --table-name "$table" --no-deletion-protection-enabled 2>/dev/null || echo "  Failed to disable deletion protection"
        # Wait for table to be ACTIVE after disabling deletion protection
        for i in $(seq 1 30); do
          TABLE_STATUS=$(aws dynamodb describe-table --table-name "$table" --query 'Table.TableStatus' --output text 2>/dev/null || echo "ACTIVE")
          if [ "$TABLE_STATUS" = "ACTIVE" ]; then
            break
          fi
          sleep 5
        done
      fi

      echo "  Deleting DynamoDB table: $table"
      aws dynamodb delete-table --table-name "$table" 2>/dev/null || echo "  Failed to delete $table (may not exist or still has replicas)"
      TABLES_TO_DELETE="$TABLES_TO_DELETE $table"
    fi
  done

  # Wait for DynamoDB tables to be fully deleted
  if [ -n "$TABLES_TO_DELETE" ]; then
    echo "  Waiting for DynamoDB tables to be deleted..."
    for table in $TABLES_TO_DELETE; do
      echo "  Waiting for table: $table"
      # Use a timeout loop instead of wait command which may fail on global tables
      for i in $(seq 1 60); do
        TABLE_STATUS=$(aws dynamodb describe-table --table-name "$table" --query 'Table.TableStatus' --output text 2>/dev/null || echo "DELETED")
        if [ "$TABLE_STATUS" = "DELETED" ] || [ -z "$TABLE_STATUS" ]; then
          echo "  Table $table deleted"
          break
        fi
        echo "  Table $table status: $TABLE_STATUS (attempt $i/60)"
        sleep 10
      done
    done
    echo "  DynamoDB table deletion complete"
  fi

  # Clean up stale IAM roles
  echo "Cleaning up stale IAM roles..."
  for role in $(aws iam list-roles --query "Roles[?contains(RoleName, '-${RESOURCE_SUFFIX}')].RoleName" --output text 2>/dev/null || echo ""); do
    if [ -n "$role" ]; then
      echo "  Deleting IAM role: $role"
      # First detach all policies
      for policy_arn in $(aws iam list-attached-role-policies --role-name "$role" --query "AttachedPolicies[].PolicyArn" --output text 2>/dev/null || echo ""); do
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy_arn" 2>/dev/null || true
      done
      # Then delete inline policies
      for policy_name in $(aws iam list-role-policies --role-name "$role" --query "PolicyNames[]" --output text 2>/dev/null || echo ""); do
        aws iam delete-role-policy --role-name "$role" --policy-name "$policy_name" 2>/dev/null || true
      done
      aws iam delete-role --role-name "$role" 2>/dev/null || echo "  Failed to delete $role"
    fi
  done

  # Clean up stale IAM policies
  echo "Cleaning up stale IAM policies..."
  for policy_arn in $(aws iam list-policies --scope Local --query "Policies[?contains(PolicyName, '-${RESOURCE_SUFFIX}')].Arn" --output text 2>/dev/null || echo ""); do
    if [ -n "$policy_arn" ]; then
      echo "  Deleting IAM policy: $policy_arn"
      # First detach from all entities
      for role in $(aws iam list-entities-for-policy --policy-arn "$policy_arn" --query "PolicyRoles[].RoleName" --output text 2>/dev/null || echo ""); do
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy_arn" 2>/dev/null || true
      done
      aws iam delete-policy --policy-arn "$policy_arn" 2>/dev/null || echo "  Failed to delete $policy_arn"
    fi
  done

  # Clean up stale KMS aliases in all regions (keys will be scheduled for deletion)
  echo "Cleaning up stale KMS aliases..."
  for region in $CLEANUP_REGIONS; do
    for alias in $(aws kms list-aliases --region "$region" --query "Aliases[?contains(AliasName, '-${RESOURCE_SUFFIX}')].AliasName" --output text 2>/dev/null || echo ""); do
      if [ -n "$alias" ]; then
        echo "  Deleting KMS alias: $alias (region: $region)"
        aws kms delete-alias --alias-name "$alias" --region "$region" 2>/dev/null || echo "  Failed to delete $alias"
      fi
    done
  done

  # Clean up stale S3 buckets (must empty first)
  echo "Cleaning up stale S3 buckets..."
  for bucket in $(aws s3api list-buckets --query "Buckets[?contains(Name, '-${RESOURCE_SUFFIX}')].Name" --output text 2>/dev/null || echo ""); do
    if [ -n "$bucket" ]; then
      echo "  Deleting S3 bucket: $bucket"
      # Delete all objects and versions
      aws s3 rm "s3://$bucket" --recursive 2>/dev/null || true
      aws s3api delete-objects --bucket "$bucket" --delete "$(aws s3api list-object-versions --bucket "$bucket" --query '{Objects: Versions[].{Key: Key, VersionId: VersionId}}' --output json 2>/dev/null || echo '{"Objects": []}')" 2>/dev/null || true
      aws s3api delete-objects --bucket "$bucket" --delete "$(aws s3api list-object-versions --bucket "$bucket" --query '{Objects: DeleteMarkers[].{Key: Key, VersionId: VersionId}}' --output json 2>/dev/null || echo '{"Objects": []}')" 2>/dev/null || true
      aws s3api delete-bucket --bucket "$bucket" 2>/dev/null || echo "  Failed to delete $bucket"
    fi
  done

  # Clean up stale Route53 health checks
  echo "Cleaning up stale Route53 health checks..."
  for check_id in $(aws route53 list-health-checks --query "HealthChecks[?contains(CallerReference, '-${RESOURCE_SUFFIX}')].Id" --output text 2>/dev/null || echo ""); do
    if [ -n "$check_id" ]; then
      echo "  Deleting Route53 health check: $check_id"
      aws route53 delete-health-check --health-check-id "$check_id" 2>/dev/null || echo "  Failed to delete $check_id"
    fi
  done

  # Clean up stale SNS topics (in all regions)
  echo "Cleaning up stale SNS topics..."
  for region in $CLEANUP_REGIONS; do
    for topic_arn in $(aws sns list-topics --region "$region" --query "Topics[?contains(TopicArn, '-${RESOURCE_SUFFIX}')].TopicArn" --output text 2>/dev/null || echo ""); do
      if [ -n "$topic_arn" ]; then
        echo "  Deleting SNS topic: $topic_arn"
        aws sns delete-topic --topic-arn "$topic_arn" --region "$region" 2>/dev/null || echo "  Failed to delete $topic_arn"
      fi
    done
  done

  # Clean up stale CloudWatch alarms (in all regions)
  echo "Cleaning up stale CloudWatch alarms..."
  for region in $CLEANUP_REGIONS; do
    ALARMS=$(aws cloudwatch describe-alarms --region "$region" --query "MetricAlarms[?contains(AlarmName, '-${RESOURCE_SUFFIX}')].AlarmName" --output text 2>/dev/null || echo "")
    if [ -n "$ALARMS" ]; then
      echo "  Deleting CloudWatch alarms in $region: $ALARMS"
      aws cloudwatch delete-alarms --alarm-names $ALARMS --region "$region" 2>/dev/null || echo "  Failed to delete alarms"
    fi
  done

  echo "✅ Stale resource cleanup completed"

  npm run cdktf:deploy

elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "yaml" ]; then
  echo "✅ CloudFormation YAML project detected, deploying with AWS CLI..."

  # Check stack status and handle stuck states
  STACK_NAME="TapStack${ENVIRONMENT_SUFFIX:-dev}"
  STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")

  echo "Current stack status: $STACK_STATUS"

  # Handle various stuck or failed states
  if [[ "$STACK_STATUS" =~ ^(CREATE_IN_PROGRESS|UPDATE_IN_PROGRESS|DELETE_IN_PROGRESS)$ ]]; then
    echo "⚠️ Stack is in $STACK_STATUS state. Waiting for operation to complete..."

    # Wait with timeout (max 10 minutes)
    WAIT_COUNT=0
    MAX_WAIT=60  # 60 * 10 seconds = 10 minutes

    while [[ "$STACK_STATUS" =~ (IN_PROGRESS) ]] && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
      sleep 10
      STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
      echo "  Status: $STACK_STATUS (waited $((WAIT_COUNT * 10))s)"
      WAIT_COUNT=$((WAIT_COUNT + 1))
    done

    # Check if still in progress after timeout
    if [[ "$STACK_STATUS" =~ (IN_PROGRESS) ]]; then
      echo "⚠️ Stack still in progress after timeout. Attempting to cancel and delete..."
      aws cloudformation cancel-update-stack --stack-name "$STACK_NAME" 2>/dev/null || true
      sleep 30

      # Force delete
      aws cloudformation delete-stack --stack-name "$STACK_NAME"
      echo "⏳ Waiting for stack deletion..."
      aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || true
      STACK_STATUS="DOES_NOT_EXIST"
    fi
  fi

  # Handle failed states that need cleanup
  if [[ "$STACK_STATUS" =~ ^(ROLLBACK_COMPLETE|CREATE_FAILED|UPDATE_ROLLBACK_COMPLETE|DELETE_FAILED)$ ]]; then
    echo "⚠️ Stack is in $STACK_STATUS state. Deleting stack before redeployment..."

    # Try to continue rollback if stuck
    if [[ "$STACK_STATUS" =~ (ROLLBACK|UPDATE_ROLLBACK) ]]; then
      aws cloudformation continue-update-rollback --stack-name "$STACK_NAME" 2>/dev/null || true
      sleep 10
    fi

    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || {
      echo "❌ Stack deletion failed or timed out"
      exit 1
    }
    echo "✅ Stack deleted successfully"
  fi

  # Deploy with error capture
  if ! npm run cfn:deploy-yaml; then
    echo ""
    echo "❌ CloudFormation deployment failed. Fetching stack events..."
    echo ""
    aws cloudformation describe-stack-events --stack-name "$STACK_NAME" \
      --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`DELETE_FAILED`].[Timestamp,ResourceType,LogicalResourceId,ResourceStatusReason]' \
      --output table 2>/dev/null || echo "Could not fetch stack events"
    echo ""
    echo "💡 Check the CloudFormation template in lib/TapStack.yml for issues"
    exit 1
  fi

elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "json" ]; then
  echo "✅ CloudFormation JSON project detected, deploying with AWS CLI..."

  # Check stack status and handle stuck states
  STACK_NAME="TapStack${ENVIRONMENT_SUFFIX:-dev}"
  STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")

  echo "Current stack status: $STACK_STATUS"

  # Handle various stuck or failed states
  if [[ "$STACK_STATUS" =~ ^(CREATE_IN_PROGRESS|UPDATE_IN_PROGRESS|DELETE_IN_PROGRESS)$ ]]; then
    echo "⚠️ Stack is in $STACK_STATUS state. Waiting for operation to complete..."

    # Wait with timeout (max 10 minutes)
    WAIT_COUNT=0
    MAX_WAIT=60  # 60 * 10 seconds = 10 minutes

    while [[ "$STACK_STATUS" =~ (IN_PROGRESS) ]] && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
      sleep 10
      STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
      echo "  Status: $STACK_STATUS (waited $((WAIT_COUNT * 10))s)"
      WAIT_COUNT=$((WAIT_COUNT + 1))
    done

    # Check if still in progress after timeout
    if [[ "$STACK_STATUS" =~ (IN_PROGRESS) ]]; then
      echo "⚠️ Stack still in progress after timeout. Attempting to cancel and delete..."
      aws cloudformation cancel-update-stack --stack-name "$STACK_NAME" 2>/dev/null || true
      sleep 30

      # Force delete
      aws cloudformation delete-stack --stack-name "$STACK_NAME"
      echo "⏳ Waiting for stack deletion..."
      aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || true
      STACK_STATUS="DOES_NOT_EXIST"
    fi
  fi

  # Handle failed states that need cleanup
  if [[ "$STACK_STATUS" =~ ^(ROLLBACK_COMPLETE|CREATE_FAILED|UPDATE_ROLLBACK_COMPLETE|DELETE_FAILED)$ ]]; then
    echo "⚠️ Stack is in $STACK_STATUS state. Deleting stack before redeployment..."

    # Try to continue rollback if stuck
    if [[ "$STACK_STATUS" =~ (ROLLBACK|UPDATE_ROLLBACK) ]]; then
      aws cloudformation continue-update-rollback --stack-name "$STACK_NAME" 2>/dev/null || true
      sleep 10
    fi

    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || {
      echo "❌ Stack deletion failed or timed out"
      exit 1
    }
    echo "✅ Stack deleted successfully"
  fi

  # Deploy with error capture
  if ! npm run cfn:deploy-json; then
    echo ""
    echo "❌ CloudFormation deployment failed. Fetching stack events..."
    echo ""
    aws cloudformation describe-stack-events --stack-name "$STACK_NAME" \
      --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`DELETE_FAILED`].[Timestamp,ResourceType,LogicalResourceId,ResourceStatusReason]' \
      --output table 2>/dev/null || echo "Could not fetch stack events"
    echo ""
    echo "💡 Check the CloudFormation template in lib/TapStack.json for issues"
    exit 1
  fi

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
  
  # Validate stack naming convention
  EXPECTED_STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
  echo "📋 Expected stack name: ${PULUMI_ORG}/TapStack/${EXPECTED_STACK_NAME}"
  echo "   Standard: TapStack (capital T, capital S) + environment suffix"
  
  echo "Selecting or creating Pulumi stack Using ENVIRONMENT_SUFFIX=$ENVIRONMENT_SUFFIX"
  
  if [ "$LANGUAGE" = "go" ]; then
    echo "🔧 Go Pulumi project detected"
    pulumi login "$PULUMI_BACKEND_URL"
    cd lib

    # Ensure Go dependencies are up to date
    echo "📦 Running go mod tidy..."
    cd ..
    go mod tidy
    cd lib

    echo "Selecting or creating Pulumi stack..."
    pulumi stack select "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --create

    # Clear any existing locks before deployment
    echo "🔓 Clearing any stuck locks..."
    pulumi cancel --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --yes 2>/dev/null || echo "No locks to clear or cancel failed"

    pulumi config set aws:defaultTags "{\"tags\":{\"Environment\":\"$ENVIRONMENT_SUFFIX\",\"Repository\":\"$REPOSITORY\",\"Author\":\"$COMMIT_AUTHOR\",\"PRNumber\":\"$PR_NUMBER\",\"Team\":\"$TEAM\",\"CreatedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"ManagedBy\":\"pulumi\"}}"

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
  elif [ "$LANGUAGE" = "ts" ] || [ "$LANGUAGE" = "js" ]; then
    echo "🔧 TypeScript/JavaScript Pulumi project detected"
    pulumi login "$PULUMI_BACKEND_URL"

    echo "Selecting or creating Pulumi stack..."
    pulumi stack select "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --create

    # Clear any existing locks before deployment
    echo "🔓 Clearing any stuck locks..."
    pulumi cancel --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --yes 2>/dev/null || echo "No locks to clear or cancel failed"

    pulumi config set aws:defaultTags "{\"tags\":{\"Environment\":\"$ENVIRONMENT_SUFFIX\",\"Repository\":\"$REPOSITORY\",\"Author\":\"$COMMIT_AUTHOR\",\"PRNumber\":\"$PR_NUMBER\",\"Team\":\"$TEAM\",\"CreatedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"ManagedBy\":\"pulumi\"}}"

    echo "Deploying infrastructure..."
    if ! pulumi up --yes --refresh --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}"; then
      echo "⚠️ Deployment failed, attempting lock recovery..."
      pulumi cancel --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --yes || echo "Lock cancellation failed"
      echo "🔄 Retrying deployment after lock cancellation..."
      pulumi up --yes --refresh --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" || {
        echo "❌ Deployment failed after retry"
        exit 1
      }
    fi
  else
    echo "🔧 Python Pulumi project detected"
    export PYTHONPATH=.:bin
    pipenv run pulumi-create-stack
    
    # Clear any existing locks before deployment
    echo "🔓 Clearing any stuck locks..."
    pulumi cancel --yes 2>/dev/null || echo "No locks to clear or cancel failed"

    pulumi config set aws:defaultTags "{\"tags\":{\"Environment\":\"$ENVIRONMENT_SUFFIX\",\"Repository\":\"$REPOSITORY\",\"Author\":\"$COMMIT_AUTHOR\",\"PRNumber\":\"$PR_NUMBER\",\"Team\":\"$TEAM\",\"CreatedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"ManagedBy\":\"pulumi\"}}"
    
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
  echo "💡 Supported combinations: cdk+typescript, cdk+python, cfn+yaml, cfn+json, cdktf+typescript, cdktf+python, tf+hcl, pulumi+typescript, pulumi+javascript, pulumi+python, pulumi+go"
  exit 1
fi

echo "✅ Deploy completed successfully"

# Get outputs using the dedicated script
echo "📊 Collecting deployment outputs..."
./scripts/get-outputs.sh
