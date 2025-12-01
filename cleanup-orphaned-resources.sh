#!/bin/bash
# Cleanup orphaned AWS resources for q6r8c2f7

set -e

SUFFIX="q6r8c2f7"
REGION="${AWS_REGION:-us-east-1}"

echo "Cleaning up orphaned resources for suffix: $SUFFIX in region: $REGION"

# Clean up CloudWatch Log Groups
echo "Deleting CloudWatch log groups..."
for log_group in "/aws/lambda/thumbnail-generator-$SUFFIX" "/aws/lambda/watermark-applier-$SUFFIX" "/aws/lambda/metadata-extractor-$SUFFIX"; do
    aws logs delete-log-group --log-group-name "$log_group" --region "$REGION" 2>/dev/null && echo "  Deleted: $log_group" || echo "  Not found or error: $log_group"
done

# Clean up IAM Roles (detach policies first, then delete inline policies, then delete role)
echo "Deleting IAM roles..."
for role in "metadata-lambda-role-$SUFFIX" "thumbnail-lambda-role-$SUFFIX" "watermark-lambda-role-$SUFFIX"; do
    echo "  Processing role: $role"
    # Detach managed policies
    aws iam list-attached-role-policies --role-name "$role" 2>/dev/null | \
        jq -r '.AttachedPolicies[].PolicyArn' | \
        xargs -I {} aws iam detach-role-policy --role-name "$role" --policy-arn {} 2>/dev/null || true

    # Delete inline policies
    aws iam list-role-policies --role-name "$role" 2>/dev/null | \
        jq -r '.PolicyNames[]' | \
        xargs -I {} aws iam delete-role-policy --role-name "$role" --policy-name {} 2>/dev/null || true

    # Delete role
    aws iam delete-role --role-name "$role" 2>/dev/null && echo "    Deleted: $role" || echo "    Not found or error: $role"
done

# Clean up S3 Buckets (empty first, then delete)
echo "Deleting S3 buckets..."
for bucket in "image-input-$SUFFIX" "image-output-$SUFFIX"; do
    echo "  Processing bucket: $bucket"
    # Empty bucket
    aws s3 rm "s3://$bucket" --recursive --region "$REGION" 2>/dev/null || true
    # Delete bucket
    aws s3 rb "s3://$bucket" --force --region "$REGION" 2>/dev/null && echo "    Deleted: $bucket" || echo "    Not found or error: $bucket"
done

echo "Cleanup complete!"
