#!/bin/bash
# Unit Tests for VPC Module
# Tests VPC module configuration and structure

set -e

echo "========================================="
echo "VPC Module Unit Tests"
echo "========================================="

# Test 1: VPC module exists
echo ""
echo "Test 1: Checking VPC module exists..."
if [ -d "lib/modules/vpc" ]; then
    echo "✓ PASS: VPC module directory exists"
else
    echo "✗ FAIL: VPC module directory not found"
    exit 1
fi

# Test 2: VPC module has required files
echo ""
echo "Test 2: Checking VPC module files..."
for file in main.tf variables.tf outputs.tf; do
    if [ -f "lib/modules/vpc/$file" ]; then
        echo "✓ PASS: $file exists"
    else
        echo "✗ FAIL: $file not found"
        exit 1
    fi
done

# Test 3: VPC creates private subnets
echo ""
echo "Test 3: Checking for private subnets..."
if grep -q 'resource "aws_subnet" "private"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: Private subnets defined"
else
    echo "✗ FAIL: Private subnets not found"
    exit 1
fi

# Test 4: VPC creates public subnets
echo ""
echo "Test 4: Checking for public subnets..."
if grep -q 'resource "aws_subnet" "public"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: Public subnets defined"
else
    echo "✗ FAIL: Public subnets not found"
    exit 1
fi

# Test 5: Internet Gateway configured
echo ""
echo "Test 5: Checking for Internet Gateway..."
if grep -q 'resource "aws_internet_gateway"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: Internet Gateway defined"
else
    echo "✗ FAIL: Internet Gateway not found"
    exit 1
fi

# Test 6: NAT Gateway configured
echo ""
echo "Test 6: Checking for NAT Gateway..."
if grep -q 'resource "aws_nat_gateway"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: NAT Gateway defined"
else
    echo "✗ FAIL: NAT Gateway not found"
    exit 1
fi

# Test 7: Public route table configured
echo ""
echo "Test 7: Checking for public route table..."
if grep -q 'resource "aws_route_table" "public"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: Public route table defined"
else
    echo "✗ FAIL: Public route table not found"
    exit 1
fi

# Test 8: Private route table configured
echo ""
echo "Test 8: Checking for private route table..."
if grep -q 'resource "aws_route_table" "private"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: Private route table defined"
else
    echo "✗ FAIL: Private route table not found"
    exit 1
fi

# Test 9: Security groups defined
echo ""
echo "Test 9: Checking for security groups..."
if grep -q 'resource "aws_security_group"' lib/modules/vpc/main.tf; then
    echo "✓ PASS: Security groups defined"
else
    echo "✗ FAIL: Security groups not found"
    exit 1
fi

# Test 10: VPC outputs defined
echo ""
echo "Test 10: Checking VPC outputs..."
if grep -q 'output "vpc_id"' lib/modules/vpc/outputs.tf && \
   grep -q 'output "private_subnet_ids"' lib/modules/vpc/outputs.tf && \
   grep -q 'output "public_subnet_ids"' lib/modules/vpc/outputs.tf; then
    echo "✓ PASS: Required outputs defined"
else
    echo "✗ FAIL: Required outputs missing"
    exit 1
fi

# Test 11: Environment suffix used in resource naming
echo ""
echo "Test 11: Checking environment_suffix usage..."
if grep -q 'var.environment_suffix' lib/modules/vpc/main.tf; then
    echo "✓ PASS: environment_suffix used in resource naming"
else
    echo "✗ FAIL: environment_suffix not used"
    exit 1
fi

# Test 12: Check for 3 AZs
echo ""
echo "Test 12: Checking for 3 availability zones..."
if grep -q 'count.*=.*3' lib/modules/vpc/main.tf; then
    echo "✓ PASS: 3 AZs configured"
else
    echo "✗ FAIL: Not configured for 3 AZs"
    exit 1
fi

echo ""
echo "========================================="
echo "All VPC module tests passed!"
echo "========================================="
