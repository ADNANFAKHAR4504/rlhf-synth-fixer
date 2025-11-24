#!/bin/bash
# Terraform Validation Tests
# This script validates Terraform configuration syntax and structure

set -e

echo "========================================="
echo "Terraform Validation Tests"
echo "========================================="

# Test 1: Terraform Format Check
echo ""
echo "Test 1: Checking Terraform formatting..."
cd lib
if terraform fmt -check -recursive; then
    echo "✓ PASS: Terraform files are properly formatted"
else
    echo "✗ FAIL: Terraform files need formatting"
    exit 1
fi

# Test 2: Terraform Init
echo ""
echo "Test 2: Initializing Terraform..."
if terraform init -backend=false; then
    echo "✓ PASS: Terraform initialized successfully"
else
    echo "✗ FAIL: Terraform initialization failed"
    exit 1
fi

# Test 3: Terraform Validate
echo ""
echo "Test 3: Validating Terraform configuration..."
if terraform validate; then
    echo "✓ PASS: Terraform configuration is valid"
else
    echo "✗ FAIL: Terraform validation failed"
    exit 1
fi

# Test 4: Check for environment_suffix variable
echo ""
echo "Test 4: Checking for environment_suffix variable..."
if grep -q 'variable "environment_suffix"' variables.tf; then
    echo "✓ PASS: environment_suffix variable defined"
else
    echo "✗ FAIL: environment_suffix variable not found"
    exit 1
fi

# Test 5: Check for skip_final_snapshot in Aurora module
echo ""
echo "Test 5: Checking destroyability settings..."
if grep -q "skip_final_snapshot.*=.*true" modules/aurora/main.tf; then
    echo "✓ PASS: skip_final_snapshot = true found"
else
    echo "✗ FAIL: skip_final_snapshot not set to true"
    exit 1
fi

# Test 6: Check for deletion_protection = false
if grep -q "deletion_protection.*=.*false" modules/aurora/main.tf; then
    echo "✓ PASS: deletion_protection = false found"
else
    echo "✗ FAIL: deletion_protection not set to false"
    exit 1
fi

# Test 7: Check multi-region provider configuration
echo ""
echo "Test 7: Checking multi-region provider configuration..."
if grep -q 'alias.*=.*"primary"' providers.tf && grep -q 'alias.*=.*"dr"' providers.tf; then
    echo "✓ PASS: Multi-region providers configured"
else
    echo "✗ FAIL: Multi-region providers not properly configured"
    exit 1
fi

# Test 8: Check for required tags
echo ""
echo "Test 8: Checking for required tags..."
if grep -q "Application.*=" variables.tf && grep -q "CostCenter.*=" variables.tf; then
    echo "✓ PASS: Required tags configured"
else
    echo "✗ FAIL: Required tags missing"
    exit 1
fi

# Test 9: Check for CloudWatch alarms
echo ""
echo "Test 9: Checking for CloudWatch alarms..."
if grep -q "aws_cloudwatch_metric_alarm" modules/aurora/main.tf; then
    echo "✓ PASS: CloudWatch alarms configured"
else
    echo "✗ FAIL: CloudWatch alarms not found"
    exit 1
fi

# Test 10: Check for Route53 health checks
echo ""
echo "Test 10: Checking for Route53 health checks..."
if grep -q "aws_route53_health_check" modules/route53/main.tf; then
    echo "✓ PASS: Route53 health checks configured"
else
    echo "✗ FAIL: Route53 health checks not found"
    exit 1
fi

echo ""
echo "========================================="
echo "All validation tests passed!"
echo "========================================="
