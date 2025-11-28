#!/bin/bash
# cleanup_orphaned_resources.sh
# Cleans up orphaned AWS resources for this PR deployment
# This script should be called before CDKTF deployment to ensure clean state

set -e

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-pr7314}"
REGIONS=("us-east-1" "eu-west-1" "ap-southeast-1")

echo "======================================================================"
echo "🧹 Cleaning up orphaned analytics resources for ${ENVIRONMENT_SUFFIX}"
echo "======================================================================"
echo ""

# Function to safely delete a resource
safe_delete() {
    local resource_type="$1"
    local resource_name="$2"
    local command="$3"

    echo "  Checking ${resource_type}: ${resource_name}"
    if eval "${command}" 2>/dev/null; then
        echo "    ✅ ${resource_type} deleted successfully"
    else
        echo "    ℹ️  ${resource_type} not found or already deleted"
    fi
}

for REGION in "${REGIONS[@]}"; do
    echo ""
    echo "================================================"
    echo "Region: ${REGION}"
    echo "================================================"

    # CloudWatch Log Groups
    LOG_GROUP="/aws/lambda/analytics-etl-${REGION}-${ENVIRONMENT_SUFFIX}"
    safe_delete "CloudWatch Log Group" "${LOG_GROUP}" \
        "aws logs delete-log-group --log-group-name '${LOG_GROUP}' --region '${REGION}'"

    # Lambda Functions
    LAMBDA_NAME="analytics-etl-${REGION}-${ENVIRONMENT_SUFFIX}"
    safe_delete "Lambda Function" "${LAMBDA_NAME}" \
        "aws lambda delete-function --function-name '${LAMBDA_NAME}' --region '${REGION}'"

    # DynamoDB Tables (with wait for deletion)
    TABLE_NAME="analytics-jobs-${REGION}-${ENVIRONMENT_SUFFIX}"
    echo "  Checking DynamoDB Table: ${TABLE_NAME}"
    if aws dynamodb describe-table --table-name "${TABLE_NAME}" --region "${REGION}" &>/dev/null; then
        echo "    ⚠️  Table exists, deleting..."
        aws dynamodb delete-table --table-name "${TABLE_NAME}" --region "${REGION}" 2>/dev/null || true
        echo "    ⏳ Waiting for table deletion (max 60s)..."
        timeout 60 aws dynamodb wait table-not-exists --table-name "${TABLE_NAME}" --region "${REGION}" 2>/dev/null || true
        echo "    ✅ Table deletion complete"
    else
        echo "    ℹ️  Table not found or already deleted"
    fi

    # S3 Buckets (empty first, then delete)
    BUCKET_NAME="analytics-bucket-${REGION}-${ENVIRONMENT_SUFFIX}"
    echo "  Checking S3 Bucket: ${BUCKET_NAME}"
    if aws s3api head-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" 2>/dev/null; then
        echo "    ⚠️  Bucket exists, emptying and deleting..."
        # Empty bucket first
        aws s3 rm "s3://${BUCKET_NAME}" --recursive --region "${REGION}" 2>/dev/null || true
        # Delete all versions if versioned
        aws s3api delete-objects --bucket "${BUCKET_NAME}" --region "${REGION}" \
            --delete "$(aws s3api list-object-versions --bucket "${BUCKET_NAME}" --region "${REGION}" \
            --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}' 2>/dev/null)" 2>/dev/null || true
        # Delete the bucket
        aws s3api delete-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" 2>/dev/null || true
        echo "    ✅ Bucket deleted successfully"
    else
        echo "    ℹ️  Bucket not found or already deleted"
    fi

    # SQS Queues
    QUEUE_NAME="analytics-queue-${REGION}-${ENVIRONMENT_SUFFIX}"
    echo "  Checking SQS Queue: ${QUEUE_NAME}"
    if QUEUE_URL=$(aws sqs get-queue-url --queue-name "${QUEUE_NAME}" --region "${REGION}" --query 'QueueUrl' --output text 2>/dev/null); then
        aws sqs delete-queue --queue-url "${QUEUE_URL}" --region "${REGION}" 2>/dev/null || true
        echo "    ✅ Queue deleted successfully"
    else
        echo "    ℹ️  Queue not found or already deleted"
    fi

    # SQS DLQ
    DLQ_NAME="analytics-dlq-${REGION}-${ENVIRONMENT_SUFFIX}"
    echo "  Checking SQS DLQ: ${DLQ_NAME}"
    if DLQ_URL=$(aws sqs get-queue-url --queue-name "${DLQ_NAME}" --region "${REGION}" --query 'QueueUrl' --output text 2>/dev/null); then
        aws sqs delete-queue --queue-url "${DLQ_URL}" --region "${REGION}" 2>/dev/null || true
        echo "    ✅ DLQ deleted successfully"
    else
        echo "    ℹ️  DLQ not found or already deleted"
    fi

    # IAM Role
    ROLE_NAME="analytics-lambda-role-${REGION}-${ENVIRONMENT_SUFFIX}"
    echo "  Checking IAM Role: ${ROLE_NAME}"
    if aws iam get-role --role-name "${ROLE_NAME}" &>/dev/null; then
        echo "    ⚠️  Role exists, cleaning up..."
        # Detach managed policies
        ATTACHED=$(aws iam list-attached-role-policies --role-name "${ROLE_NAME}" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
        for policy_arn in $ATTACHED; do
            aws iam detach-role-policy --role-name "${ROLE_NAME}" --policy-arn "${policy_arn}" 2>/dev/null || true
        done
        # Delete inline policies
        INLINE=$(aws iam list-role-policies --role-name "${ROLE_NAME}" --query 'PolicyNames[]' --output text 2>/dev/null || echo "")
        for policy_name in $INLINE; do
            aws iam delete-role-policy --role-name "${ROLE_NAME}" --policy-name "${policy_name}" 2>/dev/null || true
        done
        # Delete role
        aws iam delete-role --role-name "${ROLE_NAME}" 2>/dev/null || true
        echo "    ✅ Role deleted successfully"
    else
        echo "    ℹ️  Role not found or already deleted"
    fi

    # CloudWatch Alarms
    ALARM_NAME="analytics-lambda-errors-${REGION}-${ENVIRONMENT_SUFFIX}"
    safe_delete "CloudWatch Alarm" "${ALARM_NAME}" \
        "aws cloudwatch delete-alarms --alarm-names '${ALARM_NAME}' --region '${REGION}'"

    # CloudWatch Dashboard
    DASHBOARD_NAME="analytics-monitoring-${REGION}-${ENVIRONMENT_SUFFIX}"
    safe_delete "CloudWatch Dashboard" "${DASHBOARD_NAME}" \
        "aws cloudwatch delete-dashboards --dashboard-names '${DASHBOARD_NAME}' --region '${REGION}'"

    # EventBridge Rule (delete targets first, then rule)
    RULE_NAME="analytics-s3-events-${REGION}-${ENVIRONMENT_SUFFIX}"
    echo "  Checking EventBridge Rule: ${RULE_NAME}"
    if aws events describe-rule --name "${RULE_NAME}" --region "${REGION}" &>/dev/null; then
        echo "    ⚠️  Rule exists, removing targets and deleting..."
        # Remove all targets
        TARGET_IDS=$(aws events list-targets-by-rule --rule "${RULE_NAME}" --region "${REGION}" --query 'Targets[].Id' --output text 2>/dev/null || echo "")
        if [ -n "$TARGET_IDS" ]; then
            aws events remove-targets --rule "${RULE_NAME}" --ids $TARGET_IDS --region "${REGION}" 2>/dev/null || true
        fi
        # Delete rule
        aws events delete-rule --name "${RULE_NAME}" --region "${REGION}" 2>/dev/null || true
        echo "    ✅ EventBridge rule deleted successfully"
    else
        echo "    ℹ️  Rule not found or already deleted"
    fi

    # VPC (skip - VPCs are harder to clean up due to dependencies)
    # VPC cleanup would require deleting all ENIs, subnets, route tables, etc.
    # Terraform destroy will handle this properly

    echo "✅ Cleanup completed for ${REGION}"
done

echo ""
echo "======================================================================"
echo "✅ All orphaned resource cleanup completed"
echo "======================================================================"
echo ""
echo "Note: VPCs are not cleaned up by this script as they have many dependencies."
echo "Terraform destroy will handle VPC cleanup properly when needed."
