#!/bin/bash

# Set variables
BUCKET_NAME="tap-terraform-state-291686"
DYNAMODB_TABLE="tap-terraform-locks"
REGION="us-east-1"

# Create S3 bucket
echo "Creating S3 bucket..."
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $REGION

# Enable versioning on the S3 bucket
echo "Enabling bucket versioning..."
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Enable encryption on the S3 bucket
echo "Enabling bucket encryption..."
aws s3api put-bucket-encryption \
    --bucket $BUCKET_NAME \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

# Create DynamoDB table for state locking
echo "Creating DynamoDB table..."
aws dynamodb create-table \
    --table-name $DYNAMODB_TABLE \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION

echo "Backend infrastructure setup complete!"
