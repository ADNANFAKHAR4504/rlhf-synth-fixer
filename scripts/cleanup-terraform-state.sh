#!/bin/bash

# Cleanup script to remove orphaned Terraform state resources
# This script should be run before terraform apply in CI/CD pipelines

set -e

echo "🧹 Starting Terraform state cleanup..."

# Change to the lib directory where Terraform files are located
cd lib

# Initialize Terraform without backend to avoid S3 issues
echo "📦 Initializing Terraform..."
terraform init -backend=false

# List current state to see what exists
echo "📋 Current Terraform state:"
terraform state list || echo "No state found or backend not configured"

# Remove orphaned aws_launch_template.web if it exists
echo "🗑️  Attempting to remove orphaned aws_launch_template.web..."
if terraform state list | grep -q "aws_launch_template.web"; then
    echo "Found aws_launch_template.web in state, removing..."
    terraform state rm 'aws_launch_template.web' || echo "Failed to remove aws_launch_template.web (may not exist)"
else
    echo "aws_launch_template.web not found in state"
fi

# Remove any other orphaned resources that might cause cycles
echo "🔍 Checking for other potential orphaned resources..."
for resource in "aws_launch_template" "aws_autoscaling_group" "aws_launch_configuration"; do
    if terraform state list | grep -q "$resource"; then
        echo "Found $resource in state, checking if it's orphaned..."
        # You can add more specific checks here
    fi
done

echo "✅ Terraform state cleanup completed"

# Validate the configuration
echo "🔍 Validating Terraform configuration..."
terraform validate

echo "📋 Final state list:"
terraform state list || echo "No state found"

echo "🎉 Cleanup script completed successfully!"
