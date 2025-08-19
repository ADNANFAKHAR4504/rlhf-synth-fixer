#!/bin/bash

# setup-terraform-backend.sh
# Creates the required S3 bucket and DynamoDB table for Terraform state management

set -e

# Configuration
AWS_REGION="us-east-1"
S3_BUCKET="iac-rlhf-tf-states"
DYNAMODB_TABLE="terraform-locks"

echo "🚀 Setting up Terraform backend infrastructure..."
echo "Region: $AWS_REGION"
echo "S3 Bucket: $S3_BUCKET"
echo "DynamoDB Table: $DYNAMODB_TABLE"

# Check if S3 bucket exists
if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
    echo "✅ S3 bucket $S3_BUCKET already exists"
else
    echo "📦 Creating S3 bucket $S3_BUCKET..."
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION"
    else
        aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    
    # Enable versioning
    echo "🔄 Enabling versioning on S3 bucket..."
    aws s3api put-bucket-versioning --bucket "$S3_BUCKET" --versioning-configuration Status=Enabled
    
    # Enable encryption
    echo "🔒 Enabling encryption on S3 bucket..."
    aws s3api put-bucket-encryption --bucket "$S3_BUCKET" --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
    
    # Block public access
    echo "🛡️ Blocking public access on S3 bucket..."
    aws s3api put-public-access-block --bucket "$S3_BUCKET" --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    echo "✅ S3 bucket $S3_BUCKET created and configured"
fi

# Check if DynamoDB table exists
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null; then
    echo "✅ DynamoDB table $DYNAMODB_TABLE already exists"
else
    echo "🗃️ Creating DynamoDB table $DYNAMODB_TABLE..."
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions \
            AttributeName=LockID,AttributeType=S \
        --key-schema \
            AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$AWS_REGION"
    
    echo "⏳ Waiting for DynamoDB table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    
    echo "✅ DynamoDB table $DYNAMODB_TABLE created"
fi

echo ""
echo "🎉 Terraform backend infrastructure setup complete!"
echo ""
echo "Backend configuration:"
echo "  bucket         = \"$S3_BUCKET\""
echo "  region         = \"$AWS_REGION\""
echo "  dynamodb_table = \"$DYNAMODB_TABLE\""
echo "  encrypt        = true"
echo ""
echo "You can now run terraform init with these backend settings."
