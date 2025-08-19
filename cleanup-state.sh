#!/bin/bash

echo "=== Terraform State Cleanup Script ==="
echo "This script will help resolve the dependency cycle issue."

# Check if we're in the right directory
if [ ! -f "lib/tap_stack.tf" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

cd lib

echo "1. Checking current state..."
terraform state list

echo ""
echo "2. Attempting to remove launch template from state..."
terraform state rm aws_launch_template.web 2>/dev/null || echo "aws_launch_template.web not found in state"
terraform state rm aws_launch_template.main 2>/dev/null || echo "aws_launch_template.main not found in state"
terraform state rm aws_launch_template.app 2>/dev/null || echo "aws_launch_template.app not found in state"

echo ""
echo "3. Validating configuration..."
terraform validate

echo ""
echo "4. Planning to check for remaining issues..."
terraform plan -out=tfplan

echo ""
echo "=== Cleanup Complete ==="
echo "If the plan succeeds, you can now run: terraform apply tfplan"
echo "If issues persist, you may need to manually remove more resources from state."
