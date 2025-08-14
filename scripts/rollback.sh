#!/bin/bash

# Rollback script for corpSec logging infrastructure
# This script provides a clean rollback mechanism for failed deployments

set -e

echo "🔄 Starting infrastructure rollback..."

# Set environment variables if not provided
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export AWS_REGION=${AWS_REGION:-us-east-1}

echo "📋 Rolling back environment: ${ENVIRONMENT_SUFFIX}"
echo "🌍 AWS Region: ${AWS_REGION}"

# Check if terraform is initialized
if [ ! -d "lib/.terraform" ]; then
    echo "⚠️  Terraform not initialized. Attempting to initialize..."
    cd lib
    terraform init -backend-config="bucket=${TF_STATE_BUCKET:-iac-rlhf-tfstates-${AWS_REGION}}" \
                   -backend-config="key=${ENVIRONMENT_SUFFIX}/terraform.tfstate" \
                   -backend-config="region=${AWS_REGION}" \
                   -backend-config="encrypt=true" || {
        echo "❌ Failed to initialize terraform. Manual cleanup may be required."
        exit 1
    }
    cd ..
fi

# Empty S3 buckets before destruction (required for bucket deletion)
echo "🗑️  Emptying S3 buckets..."
BUCKET_NAME=$(cd lib && terraform output -raw s3_bucket_name 2>/dev/null || echo "")
if [ -n "$BUCKET_NAME" ]; then
    echo "📦 Emptying bucket: $BUCKET_NAME"
    aws s3 rm "s3://$BUCKET_NAME" --recursive --region "$AWS_REGION" || echo "⚠️  Failed to empty bucket or bucket doesn't exist"
else
    echo "⚠️  Could not determine bucket name from terraform outputs"
fi

# Destroy infrastructure
echo "💥 Destroying infrastructure..."
cd lib
terraform destroy -auto-approve \
    -var="environment_suffix=${ENVIRONMENT_SUFFIX}" \
    -var="aws_region=${AWS_REGION}" || {
    echo "❌ Terraform destroy failed. Some resources may require manual cleanup."
    echo "🔍 Check AWS console for remaining resources with suffix: ${ENVIRONMENT_SUFFIX}"
    exit 1
}

# Clean up terraform state files
echo "🧹 Cleaning up terraform state files..."
rm -f terraform.tfstate terraform.tfstate.backup tfplan

cd ..

echo "✅ Rollback completed successfully!"
echo "🔍 Verify in AWS console that all resources have been cleaned up."
echo "📝 Resources were prefixed with: corpSec-${ENVIRONMENT_SUFFIX}"