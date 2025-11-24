#!/bin/bash
# Unit Tests for ECS Module
# Tests ECS Fargate module configuration

set -e

echo "========================================="
echo "ECS Module Unit Tests"
echo "========================================="

# Test 1: ECS module exists
echo ""
echo "Test 1: Checking ECS module exists..."
if [ -d "lib/modules/ecs" ]; then
    echo "✓ PASS: ECS module directory exists"
else
    echo "✗ FAIL: ECS module directory not found"
    exit 1
fi

# Test 2: ECS module has required files
echo ""
echo "Test 2: Checking ECS module files..."
for file in main.tf variables.tf outputs.tf; do
    if [ -f "lib/modules/ecs/$file" ]; then
        echo "✓ PASS: $file exists"
    else
        echo "✗ FAIL: $file not found"
        exit 1
    fi
done

# Test 3: ECS cluster defined
echo ""
echo "Test 3: Checking for ECS cluster..."
if grep -q 'resource "aws_ecs_cluster"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: ECS cluster defined"
else
    echo "✗ FAIL: ECS cluster not found"
    exit 1
fi

# Test 4: Fargate capacity provider
echo ""
echo "Test 4: Checking for Fargate capacity provider..."
if grep -q 'FARGATE' lib/modules/ecs/main.tf; then
    echo "✓ PASS: Fargate capacity provider configured"
else
    echo "✗ FAIL: Fargate not configured"
    exit 1
fi

# Test 5: ECS task definition
echo ""
echo "Test 5: Checking for ECS task definition..."
if grep -q 'resource "aws_ecs_task_definition"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: ECS task definition defined"
else
    echo "✗ FAIL: ECS task definition not found"
    exit 1
fi

# Test 6: ECS service defined
echo ""
echo "Test 6: Checking for ECS service..."
if grep -q 'resource "aws_ecs_service"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: ECS service defined"
else
    echo "✗ FAIL: ECS service not found"
    exit 1
fi

# Test 7: Application Load Balancer
echo ""
echo "Test 7: Checking for Application Load Balancer..."
if grep -q 'resource "aws_lb"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: Application Load Balancer defined"
else
    echo "✗ FAIL: Application Load Balancer not found"
    exit 1
fi

# Test 8: ALB is internet-facing
echo ""
echo "Test 8: Checking ALB is internet-facing..."
if grep -q 'internal.*=.*false' lib/modules/ecs/main.tf; then
    echo "✓ PASS: ALB configured as internet-facing"
else
    echo "✗ FAIL: ALB not configured as internet-facing"
    exit 1
fi

# Test 9: Target group configured
echo ""
echo "Test 9: Checking for target group..."
if grep -q 'resource "aws_lb_target_group"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: Target group defined"
else
    echo "✗ FAIL: Target group not found"
    exit 1
fi

# Test 10: Auto-scaling configured
echo ""
echo "Test 10: Checking for auto-scaling..."
if grep -q 'resource "aws_appautoscaling_target"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: Auto-scaling configured"
else
    echo "✗ FAIL: Auto-scaling not configured"
    exit 1
fi

# Test 11: CloudWatch logs configured
echo ""
echo "Test 11: Checking for CloudWatch logs..."
if grep -q 'resource "aws_cloudwatch_log_group"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: CloudWatch log group configured"
else
    echo "✗ FAIL: CloudWatch log group not found"
    exit 1
fi

# Test 12: IAM roles configured
echo ""
echo "Test 12: Checking for IAM roles..."
if grep -q 'resource "aws_iam_role"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: IAM roles configured"
else
    echo "✗ FAIL: IAM roles not found"
    exit 1
fi

# Test 13: Security groups configured
echo ""
echo "Test 13: Checking for security groups..."
if grep -q 'resource "aws_security_group"' lib/modules/ecs/main.tf; then
    echo "✓ PASS: Security groups configured"
else
    echo "✗ FAIL: Security groups not found"
    exit 1
fi

# Test 14: Health checks configured
echo ""
echo "Test 14: Checking for health checks..."
if grep -q 'health_check' lib/modules/ecs/main.tf; then
    echo "✓ PASS: Health checks configured"
else
    echo "✗ FAIL: Health checks not found"
    exit 1
fi

# Test 15: Environment suffix usage
echo ""
echo "Test 15: Checking environment_suffix usage..."
if grep -q 'var.environment_suffix' lib/modules/ecs/main.tf; then
    echo "✓ PASS: environment_suffix used in resource naming"
else
    echo "✗ FAIL: environment_suffix not used"
    exit 1
fi

echo ""
echo "========================================="
echo "All ECS module tests passed!"
echo "========================================="
