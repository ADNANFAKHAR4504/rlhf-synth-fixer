#!/bin/bash
# Terraform Validation Test Suite
# Tests for ECS Fargate Microservices Platform

set -e

echo "=========================================="
echo "Terraform Validation Test Suite"
echo "=========================================="

# Navigate to lib directory
cd "$(dirname "$0")/../lib"

# Test 1: Terraform Format Check
echo ""
echo "Test 1: Checking Terraform formatting..."
if terraform fmt -check -recursive .; then
    echo "PASS: Terraform files are properly formatted"
else
    echo "FAIL: Terraform files need formatting"
    exit 1
fi

# Test 2: Terraform Validation
echo ""
echo "Test 2: Validating Terraform configuration..."
terraform init -backend=false > /dev/null 2>&1
if terraform validate; then
    echo "PASS: Terraform configuration is valid"
else
    echo "FAIL: Terraform validation failed"
    exit 1
fi

# Test 3: Check for required files
echo ""
echo "Test 3: Checking for required files..."
required_files=(
    "provider.tf"
    "variables.tf"
    "networking.tf"
    "alb.tf"
    "ecr.tf"
    "iam.tf"
    "ecs.tf"
    "autoscaling.tf"
    "appmesh.tf"
    "secrets.tf"
    "outputs.tf"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "PASS: $file exists"
    else
        echo "FAIL: $file is missing"
        exit 1
    fi
done

# Test 4: Check resource naming convention
echo ""
echo "Test 4: Checking resource naming conventions..."
if grep -r "var.environment_suffix" *.tf > /dev/null; then
    echo "PASS: Resources use environment_suffix variable"
else
    echo "FAIL: Resources don't use environment_suffix variable"
    exit 1
fi

# Test 5: Check for hardcoded secrets
echo ""
echo "Test 5: Checking for hardcoded secrets..."
if grep -r -E "(password|secret|key)\s*=\s*\"[^P][^L][^A]" *.tf | grep -v "PLACEHOLDER" > /dev/null; then
    echo "FAIL: Found potential hardcoded secrets"
    grep -r -E "(password|secret|key)\s*=\s*\"[^P][^L][^A]" *.tf | grep -v "PLACEHOLDER"
    exit 1
else
    echo "PASS: No hardcoded secrets found"
fi

# Test 6: Check for proper tagging
echo ""
echo "Test 6: Checking for resource tags..."
if grep -r "tags\s*=" *.tf > /dev/null; then
    echo "PASS: Resources have tags defined"
else
    echo "FAIL: No tags found in resources"
    exit 1
fi

# Test 7: Check provider configuration
echo ""
echo "Test 7: Checking provider configuration..."
if grep "required_version" provider.tf > /dev/null && grep "required_providers" provider.tf > /dev/null; then
    echo "PASS: Provider configuration is complete"
else
    echo "FAIL: Provider configuration is incomplete"
    exit 1
fi

# Test 8: Check for outputs
echo ""
echo "Test 8: Checking for outputs..."
if [ -f "outputs.tf" ] && grep "output" outputs.tf > /dev/null; then
    echo "PASS: Outputs are defined"
else
    echo "FAIL: Outputs are not defined"
    exit 1
fi

echo ""
echo "=========================================="
echo "All tests passed successfully!"
echo "=========================================="
