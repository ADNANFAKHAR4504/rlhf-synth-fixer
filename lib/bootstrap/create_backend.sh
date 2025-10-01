#!/usr/bin/env bash
set -euo pipefail

# Usage (CI): export BACKEND_REGION=us-east-1 ; export CI_WORKSPACE="pipeline" ; ./lib/bootstrap/create_backend.sh
# Optional env:
# - BACKEND_REGION (default us-east-1)
# - DYNAMODB_TABLE (optional name for state lock table)
# - CI_WORKSPACE or WORKSPACE (optional tagging)

BACKEND_REGION="${BACKEND_REGION:-us-east-1}"
DYNAMODB_TABLE="${DYNAMODB_TABLE:-}"
WORKSPACE="${CI_WORKSPACE:-${WORKSPACE:-ci}}"

# Resolve AWS account id
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "ERROR: cannot determine AWS account id (check AWS credentials)"
  exit 2
fi

TS=$(date -u +"%Y%m%d%H%M%S")
BACKEND_BUCKET="terraform-state-${AWS_ACCOUNT_ID}-${WORKSPACE}-${TS}"

echo "Creating backend bucket: ${BACKEND_BUCKET} (region: ${BACKEND_REGION})"

# Create bucket (handle us-east-1 specially)
if aws s3api head-bucket --bucket "$BACKEND_BUCKET" >/dev/null 2>&1; then
  echo "Bucket ${BACKEND_BUCKET} already exists or is accessible."
else
  if [ "$BACKEND_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BACKEND_BUCKET"
  else
    aws s3api create-bucket --bucket "$BACKEND_BUCKET" --create-bucket-configuration LocationConstraint="$BACKEND_REGION"
  fi
fi

# Enable versioning
aws s3api put-bucket-versioning --bucket "$BACKEND_BUCKET" --versioning-configuration Status=Enabled

# Enable server-side encryption (AES256)
aws s3api put-bucket-encryption \
  --bucket "$BACKEND_BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Block public access
aws s3api put-public-access-block \
  --bucket "$BACKEND_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Optional DynamoDB table for state locking
if [ -n "$DYNAMODB_TABLE" ]; then
  if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" >/dev/null 2>&1; then
    echo "DynamoDB table ${DYNAMODB_TABLE} exists."
  else
    aws dynamodb create-table \
      --table-name "$DYNAMODB_TABLE" \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region "$BACKEND_REGION"
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$BACKEND_REGION"
  fi
fi

# Write lib/backend.tf for terraform init
cat > lib/backend.tf <<EOF
terraform {
  backend "s3" {
    bucket = "${BACKEND_BUCKET}"
    key    = "terraform.tfstate"
    region = "${BACKEND_REGION}"
    encrypt = true
EOF

if [ -n "$DYNAMODB_TABLE" ]; then
  cat >> lib/backend.tf <<EOF
    dynamodb_table = "${DYNAMODB_TABLE}"
EOF
fi

cat >> lib/backend.tf <<'EOF'
  }
}
EOF

echo "Wrote lib/backend.tf (bucket: ${BACKEND_BUCKET}). Ready for terraform init."