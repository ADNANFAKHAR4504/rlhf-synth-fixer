#!/bin/bash
# Unit Tests for Route53 Module
# Tests Route53 failover module configuration

set -e

echo "========================================="
echo "Route53 Module Unit Tests"
echo "========================================="

# Test 1: Route53 module exists
echo ""
echo "Test 1: Checking Route53 module exists..."
if [ -d "lib/modules/route53" ]; then
    echo "✓ PASS: Route53 module directory exists"
else
    echo "✗ FAIL: Route53 module directory not found"
    exit 1
fi

# Test 2: Route53 module has required files
echo ""
echo "Test 2: Checking Route53 module files..."
for file in main.tf variables.tf outputs.tf; do
    if [ -f "lib/modules/route53/$file" ]; then
        echo "✓ PASS: $file exists"
    else
        echo "✗ FAIL: $file not found"
        exit 1
    fi
done

# Test 3: Hosted zone defined
echo ""
echo "Test 3: Checking for hosted zone..."
if grep -q 'resource "aws_route53_zone"' lib/modules/route53/main.tf; then
    echo "✓ PASS: Hosted zone defined"
else
    echo "✗ FAIL: Hosted zone not found"
    exit 1
fi

# Test 4: Health check configured
echo ""
echo "Test 4: Checking for health check..."
if grep -q 'resource "aws_route53_health_check"' lib/modules/route53/main.tf; then
    echo "✓ PASS: Health check defined"
else
    echo "✗ FAIL: Health check not found"
    exit 1
fi

# Test 5: Health check has FQDN
echo ""
echo "Test 5: Checking health check FQDN..."
if grep -q 'fqdn.*=' lib/modules/route53/main.tf; then
    echo "✓ PASS: Health check FQDN configured"
else
    echo "✗ FAIL: Health check FQDN missing"
    exit 1
fi

# Test 6: Primary failover record
echo ""
echo "Test 6: Checking for primary failover record..."
if grep -q 'failover_routing_policy' lib/modules/route53/main.tf && \
   grep -q 'type.*=.*"PRIMARY"' lib/modules/route53/main.tf; then
    echo "✓ PASS: Primary failover record defined"
else
    echo "✗ FAIL: Primary failover record not found"
    exit 1
fi

# Test 7: DR failover record
echo ""
echo "Test 7: Checking for DR failover record..."
if grep -q 'type.*=.*"SECONDARY"' lib/modules/route53/main.tf; then
    echo "✓ PASS: DR failover record defined"
else
    echo "✗ FAIL: DR failover record not found"
    exit 1
fi

# Test 8: CloudWatch alarm for health check
echo ""
echo "Test 8: Checking for CloudWatch alarm..."
if grep -q 'resource "aws_cloudwatch_metric_alarm"' lib/modules/route53/main.tf; then
    echo "✓ PASS: CloudWatch alarm configured"
else
    echo "✗ FAIL: CloudWatch alarm not found"
    exit 1
fi

# Test 9: SNS topic for notifications
echo ""
echo "Test 9: Checking for SNS topic..."
if grep -q 'resource "aws_sns_topic"' lib/modules/route53/main.tf; then
    echo "✓ PASS: SNS topic configured"
else
    echo "✗ FAIL: SNS topic not found"
    exit 1
fi

# Test 10: Health check type is HTTPS
echo ""
echo "Test 10: Checking health check type..."
if grep -q 'type.*=.*"HTTPS' lib/modules/route53/main.tf; then
    echo "✓ PASS: HTTPS health check configured"
else
    echo "✗ FAIL: HTTPS health check not configured"
    exit 1
fi

# Test 11: Health check interval configured
echo ""
echo "Test 11: Checking health check interval..."
if grep -q 'request_interval' lib/modules/route53/main.tf; then
    echo "✓ PASS: Health check interval configured"
else
    echo "✗ FAIL: Health check interval not configured"
    exit 1
fi

# Test 12: Alias records configured
echo ""
echo "Test 12: Checking for alias records..."
if grep -q 'alias {' lib/modules/route53/main.tf; then
    echo "✓ PASS: Alias records configured"
else
    echo "✗ FAIL: Alias records not found"
    exit 1
fi

# Test 13: Environment suffix usage
echo ""
echo "Test 13: Checking environment_suffix usage..."
if grep -q 'var.environment_suffix' lib/modules/route53/main.tf; then
    echo "✓ PASS: environment_suffix used in resource naming"
else
    echo "✗ FAIL: environment_suffix not used"
    exit 1
fi

echo ""
echo "========================================="
echo "All Route53 module tests passed!"
echo "========================================="
