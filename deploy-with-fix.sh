#!/bin/bash

echo "🚀 Starting Terraform Deployment with Security Hub Fix"
echo "======================================================="

# Check if AWS credentials are configured
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo "Please run: ./configure-aws.sh for setup instructions"
    exit 1
fi

echo "✅ AWS credentials configured"

# Set environment variables
export AWS_REGION=us-west-2
export AWS_DEFAULT_REGION=us-west-2
export PLATFORM=tf

echo "🔧 Environment configured:"
echo "   AWS_REGION: $AWS_REGION"
echo "   PLATFORM: $PLATFORM"

# Initialize Terraform
echo ""
echo "🏗️  Initializing Terraform..."
cd lib
if terraform init -backend-config=backend.hcl -reconfigure; then
    echo "✅ Terraform initialized successfully"
else
    echo "❌ Terraform initialization failed"
    exit 1
fi

# Generate plan
echo ""
echo "📋 Generating Terraform plan..."
if terraform plan -out=tfplan; then
    echo "✅ Plan generated successfully"
else
    echo "❌ Plan generation failed"
    exit 1
fi

# Apply the plan
echo ""
echo "🚀 Deploying infrastructure..."
echo "   - Security Hub fix applied ✅"
echo "   - Removed conflicting Security Hub account resource"
echo "   - Keeping only standards subscription"
echo ""
if terraform apply -auto-approve tfplan; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "✅ Security Hub conflict resolved"
else
    echo "❌ Deployment failed"
    exit 1
fi
