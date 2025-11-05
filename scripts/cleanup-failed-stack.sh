#!/bin/bash
# Script to clean up failed CloudFormation stacks
# Usage: ./scripts/cleanup-failed-stack.sh <stack-name> [region]

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <stack-name> [region]"
  echo "Example: $0 MigrationStack-pr5857 us-east-1"
  exit 1
fi

STACK_NAME="$1"
REGION="${2:-us-east-1}"

echo "🧹 Cleaning up failed stack resources..."
echo "📍 Region: $REGION"
echo "📦 Stack: $STACK_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ AWS CLI not configured or credentials not available"
  exit 1
fi

# Check stack status
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].StackStatus' \
  --output text 2>/dev/null || echo "DOES_NOT_EXIST")

echo "📊 Current stack status: $STACK_STATUS"

if [ "$STACK_STATUS" = "DOES_NOT_EXIST" ]; then
  echo "✅ Stack does not exist, nothing to clean up"
  exit 0
fi

if [ "$STACK_STATUS" = "ROLLBACK_FAILED" ] || [ "$STACK_STATUS" = "DELETE_FAILED" ]; then
  echo "⚠️  Stack is in $STACK_STATUS state"

  # Extract environment suffix (e.g., pr5857 from MigrationStack-pr5857)
  ENV_SUFFIX=$(echo "$STACK_NAME" | sed 's/^.*-//')

  # Try to delete problematic ElastiCache replication group
  echo "🗑️  Attempting to delete ElastiCache replication group..."
  aws elasticache delete-replication-group \
    --replication-group-id "redis-${ENV_SUFFIX}" \
    --region "$REGION" \
    --no-retain-primary-cluster 2>/dev/null || echo "   ElastiCache already deleted"

  # Wait for ElastiCache to start deleting
  echo "⏳ Waiting 30 seconds for ElastiCache deletion to start..."
  sleep 30

  # Try to continue rollback first (if ROLLBACK_FAILED)
  if [ "$STACK_STATUS" = "ROLLBACK_FAILED" ]; then
    echo "🗑️  Attempting to continue stack rollback..."
    aws cloudformation continue-update-rollback \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --resources-to-skip "RedisCluster${ENV_SUFFIX//[-]/}" 2>/dev/null || {
        echo "   Cannot continue rollback, trying direct delete..."
      }
  fi

  # Delete stack
  echo "🗑️  Deleting stack..."
  aws cloudformation delete-stack \
    --stack-name "$STACK_NAME" \
    --region "$REGION"

  echo "⏳ Waiting for stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION" 2>/dev/null && echo "✅ Stack deleted!" || {
      echo "⚠️  Stack deletion in progress. Check AWS Console for status."
      echo "   CloudFormation: https://console.aws.amazon.com/cloudformation/"
    }
else
  echo "📝 Stack is in $STACK_STATUS state. Initiating delete..."
  aws cloudformation delete-stack \
    --stack-name "$STACK_NAME" \
    --region "$REGION"
  echo "✅ Delete initiated. Check AWS Console for progress."
fi
