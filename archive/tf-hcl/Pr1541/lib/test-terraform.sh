#!/bin/bash

# test-terraform.sh - Local validation script

set -e

echo "🧪 Testing Terraform configuration locally..."

# Backup original provider.tf
if [ -f "provider.tf" ]; then
    mv provider.tf provider.tf.backup
    echo "✅ Backed up provider.tf"
fi

# Use local provider configuration
cp provider-local.tf provider.tf

# Clean up any existing Terraform state
rm -rf .terraform terraform.tfstate terraform.tfstate.backup .terraform.lock.hcl

echo "🔧 Initializing Terraform with local backend..."
terraform init

echo "📋 Validating Terraform configuration..."
terraform validate

echo "📋 Running terraform plan (dry-run)..."
terraform plan -out=tfplan-local

echo "✅ Terraform configuration is valid!"
echo "📁 Plan saved to tfplan-local"

# Restore original provider.tf
if [ -f "provider.tf.backup" ]; then
    mv provider.tf.backup provider.tf
    echo "✅ Restored original provider.tf"
fi

echo ""
echo "🎉 Success! Your Terraform configuration is syntactically correct."
echo "💡 To deploy to AWS, you'll need valid AWS credentials."
echo "💡 The following fixes were applied:"
echo "   - Added random provider for unique resource naming"
echo "   - Fixed EIP allocation to use single NAT gateway"
echo "   - Added random suffixes to avoid resource name conflicts"
echo "   - Fixed Network Monitor probes to use IP addresses"
echo "   - Added lifecycle management for existing resources"
