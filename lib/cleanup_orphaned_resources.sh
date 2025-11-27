#!/bin/bash
set -e

# Cleanup Orphaned AWS Resources for PR 7292
# This script removes orphaned resources from previous failed deployments
# to allow fresh deployments without ResourceAlreadyExists errors

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-pr7292}"
REGIONS=("us-east-1" "us-west-2" "eu-west-1")

echo "🧹 Cleaning up orphaned AWS resources for ${ENVIRONMENT_SUFFIX}"
echo "=================================================="

# Function to delete CloudWatch Log Group if exists
delete_log_group() {
    local log_group=$1
    local region=$2

    echo "Checking CloudWatch Log Group: ${log_group} in ${region}"
    if aws logs describe-log-groups --log-group-name-prefix "${log_group}" --region "${region}" 2>/dev/null | grep -q "${log_group}"; then
        echo "  Deleting log group: ${log_group}"
        aws logs delete-log-group --log-group-name "${log_group}" --region "${region}" 2>/dev/null || true
        echo "  ✅ Deleted"
    else
        echo "  ℹ️  Not found (already clean)"
    fi
}

# Function to delete IAM Role if exists
delete_iam_role() {
    local role_name=$1

    echo "Checking IAM Role: ${role_name}"
    if aws iam get-role --role-name "${role_name}" 2>/dev/null >/dev/null; then
        echo "  Detaching policies..."

        # Detach managed policies
        for policy_arn in $(aws iam list-attached-role-policies --role-name "${role_name}" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null); do
            echo "    Detaching managed policy: ${policy_arn}"
            aws iam detach-role-policy --role-name "${role_name}" --policy-arn "${policy_arn}" 2>/dev/null || true
        done

        # Delete inline policies
        for policy_name in $(aws iam list-role-policies --role-name "${role_name}" --query 'PolicyNames[*]' --output text 2>/dev/null); do
            echo "    Deleting inline policy: ${policy_name}"
            aws iam delete-role-policy --role-name "${role_name}" --policy-name "${policy_name}" 2>/dev/null || true
        done

        echo "  Deleting role: ${role_name}"
        aws iam delete-role --role-name "${role_name}" 2>/dev/null || true
        echo "  ✅ Deleted"
    else
        echo "  ℹ️  Not found (already clean)"
    fi
}

# Function to delete KMS Alias if exists
delete_kms_alias() {
    local alias_name=$1

    echo "Checking KMS Alias: ${alias_name}"
    if aws kms describe-key --key-id "${alias_name}" 2>/dev/null >/dev/null; then
        echo "  Deleting alias: ${alias_name}"
        aws kms delete-alias --alias-name "${alias_name}" 2>/dev/null || true
        echo "  ✅ Deleted"
    else
        echo "  ℹ️  Not found (already clean)"
    fi
}

# Function to delete S3 Bucket if exists
delete_s3_bucket() {
    local bucket_name=$1
    local region=$2

    echo "Checking S3 Bucket: ${bucket_name} in ${region}"
    if aws s3api head-bucket --bucket "${bucket_name}" --region "${region}" 2>/dev/null; then
        echo "  Emptying bucket: ${bucket_name}"
        aws s3 rm "s3://${bucket_name}" --recursive --region "${region}" 2>/dev/null || true

        echo "  Deleting all object versions..."
        aws s3api delete-objects --bucket "${bucket_name}" --region "${region}" \
            --delete "$(aws s3api list-object-versions --bucket "${bucket_name}" --region "${region}" \
            --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json)" 2>/dev/null || true

        echo "  Deleting all delete markers..."
        aws s3api delete-objects --bucket "${bucket_name}" --region "${region}" \
            --delete "$(aws s3api list-object-versions --bucket "${bucket_name}" --region "${region}" \
            --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' --output json)" 2>/dev/null || true

        echo "  Deleting bucket: ${bucket_name}"
        aws s3api delete-bucket --bucket "${bucket_name}" --region "${region}" 2>/dev/null || true
        echo "  ✅ Deleted"
    else
        echo "  ℹ️  Not found (already clean)"
    fi
}

# Function to delete Lambda Function if exists
delete_lambda_function() {
    local function_name=$1
    local region=$2

    echo "Checking Lambda Function: ${function_name} in ${region}"
    if aws lambda get-function --function-name "${function_name}" --region "${region}" 2>/dev/null >/dev/null; then
        echo "  Deleting function: ${function_name}"
        aws lambda delete-function --function-name "${function_name}" --region "${region}" 2>/dev/null || true
        echo "  ✅ Deleted"
    else
        echo "  ℹ️  Not found (already clean)"
    fi
}

# 1. Delete CloudWatch Log Groups
echo ""
echo "1️⃣  Cleaning up CloudWatch Log Groups..."
echo "----------------------------------------"
delete_log_group "/aws/lambda/config-remediation-${ENVIRONMENT_SUFFIX}" "us-east-1"

for region in "${REGIONS[@]}"; do
    delete_log_group "/aws/config/${region}-${ENVIRONMENT_SUFFIX}" "${region}"
done

# 2. Delete IAM Roles
echo ""
echo "2️⃣  Cleaning up IAM Roles..."
echo "----------------------------------------"
delete_iam_role "lambda-remediation-role-${ENVIRONMENT_SUFFIX}"

for region in "${REGIONS[@]}"; do
    delete_iam_role "config-role-${region}-${ENVIRONMENT_SUFFIX}"
done

# 3. Delete Lambda Functions (must be before log groups cleanup)
echo ""
echo "3️⃣  Cleaning up Lambda Functions..."
echo "----------------------------------------"
delete_lambda_function "s3-versioning-remediation-${ENVIRONMENT_SUFFIX}" "us-east-1"
delete_lambda_function "s3-encryption-remediation-${ENVIRONMENT_SUFFIX}" "us-east-1"

# 4. Delete KMS Alias
echo ""
echo "4️⃣  Cleaning up KMS Alias..."
echo "----------------------------------------"
delete_kms_alias "alias/config-key-${ENVIRONMENT_SUFFIX}"

# 5. Delete S3 Buckets
echo ""
echo "5️⃣  Cleaning up S3 Buckets..."
echo "----------------------------------------"
for region in "${REGIONS[@]}"; do
    delete_s3_bucket "config-bucket-${region}-${ENVIRONMENT_SUFFIX}" "${region}"
done

echo ""
echo "=================================================="
echo "✅ Cleanup completed successfully!"
echo ""
echo "Resources cleaned for: ${ENVIRONMENT_SUFFIX}"
echo "Regions processed: ${REGIONS[*]}"
echo ""
echo "You can now proceed with deployment."
