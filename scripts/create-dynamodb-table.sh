#!/bin/bash

# create-dynamodb-table.sh
# Creates the missing DynamoDB table for Terraform state locking

set -e

echo "🚀 Creating DynamoDB table for Terraform state locking..."

# Configuration
AWS_REGION="us-east-1"
DYNAMODB_TABLE="terraform-locks"

echo "Region: $AWS_REGION"
echo "DynamoDB Table: $DYNAMODB_TABLE"

# Check if credentials are working
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials are not valid or not configured"
    echo ""
    echo "Please configure AWS credentials using one of these methods:"
    echo "  1. aws configure"
    echo "  2. Set environment variables:"
    echo "     export AWS_ACCESS_KEY_ID=your-access-key"
    echo "     export AWS_SECRET_ACCESS_KEY=your-secret-key"
    echo "     export AWS_DEFAULT_REGION=us-east-1"
    echo ""
    exit 1
fi

echo "✅ AWS credentials are valid"

# Check if DynamoDB table exists
echo "🔍 Checking if DynamoDB table exists..."
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "✅ DynamoDB table $DYNAMODB_TABLE already exists"
    echo ""
    echo "Table details:"
    aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" --query 'Table.{TableName:TableName,Status:TableStatus,ItemCount:ItemCount,TableSizeBytes:TableSizeBytes}' --output table
else
    echo "📦 Creating DynamoDB table $DYNAMODB_TABLE..."
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions \
            AttributeName=LockID,AttributeType=S \
        --key-schema \
            AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"
    
    echo "⏳ Waiting for DynamoDB table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    
    echo "✅ DynamoDB table $DYNAMODB_TABLE created successfully"
fi

echo ""
echo "🎉 DynamoDB setup complete!"
echo ""
echo "You can now use the original deployment script with DynamoDB locking:"
echo "  ./scripts/deploy.sh"
echo ""
echo "Or continue using the no-lock deployment:"
echo "  ./scripts/deploy-without-lock.sh"
