#!/bin/bash
# Security Test Suite
# Validates security configurations

set -e

echo "=========================================="
echo "Security Test Suite"
echo "=========================================="

cd "$(dirname "$0")/../lib"

# Test 1: IAM Least Privilege
echo ""
echo "Test 1: Checking IAM least privilege policies..."
if grep "Resource.*\*" iam.tf | grep -v "sns:Publish\|ses:SendEmail" > /dev/null; then
    echo "WARNING: Found IAM policies with wildcard resources (review recommended)"
else
    echo "PASS: IAM policies appear to follow least privilege"
fi

# Test 2: Security Groups
echo ""
echo "Test 2: Checking security group configurations..."
if grep "aws_security_group" networking.tf > /dev/null && \
   grep "description" networking.tf | grep -q "security"; then
    echo "PASS: Security groups have descriptions"
else
    echo "FAIL: Security groups missing descriptions"
    exit 1
fi

# Test 3: ECR Encryption
echo ""
echo "Test 3: Checking ECR encryption..."
if grep "encryption_configuration" ecr.tf > /dev/null && \
   grep "encryption_type" ecr.tf > /dev/null; then
    echo "PASS: ECR repositories have encryption configured"
else
    echo "FAIL: ECR encryption not configured"
    exit 1
fi

# Test 4: ECR Image Scanning
echo ""
echo "Test 4: Checking ECR image scanning..."
if grep "image_scanning_configuration" ecr.tf > /dev/null && \
   grep "scan_on_push.*true" ecr.tf > /dev/null; then
    echo "PASS: ECR image scanning is enabled"
else
    echo "FAIL: ECR image scanning is not enabled"
    exit 1
fi

# Test 5: Secrets Manager Usage
echo ""
echo "Test 5: Checking Secrets Manager for sensitive data..."
if grep "aws_secretsmanager_secret" secrets.tf > /dev/null && \
   grep -v "PLACEHOLDER" secrets.tf | grep -E "(password|key|secret)" > /dev/null; then
    echo "PASS: Secrets Manager is used for sensitive data"
else
    echo "WARNING: Verify all sensitive data is in Secrets Manager"
fi

# Test 6: ECS Tasks in Private Subnets
echo ""
echo "Test 6: Checking ECS tasks deployment..."
if grep "network_configuration" ecs.tf | grep -A 2 "subnets" | grep "private" > /dev/null; then
    echo "PASS: ECS tasks are deployed in private subnets"
else
    echo "FAIL: ECS tasks are not in private subnets"
    exit 1
fi

# Test 7: ALB in Public Subnets
echo ""
echo "Test 7: Checking ALB deployment..."
if grep "aws_lb" alb.tf | grep -A 5 "subnets" | grep "public" > /dev/null; then
    echo "PASS: ALB is deployed in public subnets"
else
    echo "FAIL: ALB is not in public subnets"
    exit 1
fi

# Test 8: VPC DNS Settings
echo ""
echo "Test 8: Checking VPC DNS settings..."
if grep "enable_dns_hostnames.*true" networking.tf > /dev/null && \
   grep "enable_dns_support.*true" networking.tf > /dev/null; then
    echo "PASS: VPC DNS settings are enabled"
else
    echo "FAIL: VPC DNS settings not properly configured"
    exit 1
fi

# Test 9: IAM Role Assume Policy
echo ""
echo "Test 9: Checking IAM role trust relationships..."
if grep "assume_role_policy" iam.tf > /dev/null && \
   grep "ecs-tasks.amazonaws.com" iam.tf > /dev/null; then
    echo "PASS: IAM roles have proper trust relationships"
else
    echo "FAIL: IAM role trust relationships not configured"
    exit 1
fi

# Test 10: No Public IP on ECS Tasks
echo ""
echo "Test 10: Checking ECS task public IP assignment..."
if grep "assign_public_ip.*false" ecs.tf > /dev/null; then
    echo "PASS: ECS tasks do not have public IPs"
else
    echo "FAIL: ECS tasks may have public IPs assigned"
    exit 1
fi

# Test 11: Secrets Recovery Window
echo ""
echo "Test 11: Checking Secrets Manager recovery window..."
if grep "recovery_window_in_days" secrets.tf > /dev/null; then
    echo "PASS: Secrets have recovery window configured"
else
    echo "WARNING: Secrets recovery window should be configured"
fi

# Test 12: Security Group Egress Rules
echo ""
echo "Test 12: Checking security group egress rules..."
if grep "egress" networking.tf > /dev/null; then
    if grep "egress" networking.tf | grep -A 5 "0.0.0.0/0" > /dev/null; then
        echo "WARNING: Security groups have open egress (0.0.0.0/0) - review if necessary"
    else
        echo "PASS: Security group egress rules are restrictive"
    fi
else
    echo "FAIL: Security group egress rules not defined"
    exit 1
fi

echo ""
echo "=========================================="
echo "All security tests completed!"
echo "=========================================="
