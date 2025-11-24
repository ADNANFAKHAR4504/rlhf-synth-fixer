#!/bin/bash
# Integration Tests for Multi-Region DR Infrastructure
# These tests validate deployed resources (post-deployment validation)

set -e

echo "========================================="
echo "Integration Tests - Deployment Validation"
echo "========================================="

# Check if environment_suffix is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <environment_suffix>"
    echo "Example: $0 test-12345"
    exit 1
fi

ENVIRONMENT_SUFFIX="$1"
PRIMARY_REGION="us-east-1"
DR_REGION="us-west-2"

echo "Testing deployment with environment_suffix: $ENVIRONMENT_SUFFIX"
echo "Primary region: $PRIMARY_REGION"
echo "DR region: $DR_REGION"
echo ""

# Test 1: Check Primary VPC exists
echo "Test 1: Checking primary VPC..."
PRIMARY_VPC=$(aws ec2 describe-vpcs \
    --region $PRIMARY_REGION \
    --filters "Name=tag:Name,Values=vpc-primary-$ENVIRONMENT_SUFFIX" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "None")

if [ "$PRIMARY_VPC" != "None" ] && [ -n "$PRIMARY_VPC" ]; then
    echo "✓ PASS: Primary VPC exists: $PRIMARY_VPC"
else
    echo "✗ FAIL: Primary VPC not found"
    exit 1
fi

# Test 2: Check DR VPC exists
echo ""
echo "Test 2: Checking DR VPC..."
DR_VPC=$(aws ec2 describe-vpcs \
    --region $DR_REGION \
    --filters "Name=tag:Name,Values=vpc-dr-$ENVIRONMENT_SUFFIX" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "None")

if [ "$DR_VPC" != "None" ] && [ -n "$DR_VPC" ]; then
    echo "✓ PASS: DR VPC exists: $DR_VPC"
else
    echo "✗ FAIL: DR VPC not found"
    exit 1
fi

# Test 3: Check primary VPC has 3 private subnets
echo ""
echo "Test 3: Checking primary VPC private subnets..."
PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
    --region $PRIMARY_REGION \
    --filters "Name=vpc-id,Values=$PRIMARY_VPC" "Name=tag:Type,Values=private" \
    --query 'Subnets | length(@)' \
    --output text 2>/dev/null || echo "0")

if [ "$PRIVATE_SUBNETS" -eq 3 ]; then
    echo "✓ PASS: Primary VPC has 3 private subnets"
else
    echo "✗ FAIL: Primary VPC does not have 3 private subnets (found: $PRIVATE_SUBNETS)"
    exit 1
fi

# Test 4: Check primary VPC has 3 public subnets
echo ""
echo "Test 4: Checking primary VPC public subnets..."
PUBLIC_SUBNETS=$(aws ec2 describe-subnets \
    --region $PRIMARY_REGION \
    --filters "Name=vpc-id,Values=$PRIMARY_VPC" "Name=tag:Type,Values=public" \
    --query 'Subnets | length(@)' \
    --output text 2>/dev/null || echo "0")

if [ "$PUBLIC_SUBNETS" -eq 3 ]; then
    echo "✓ PASS: Primary VPC has 3 public subnets"
else
    echo "✗ FAIL: Primary VPC does not have 3 public subnets (found: $PUBLIC_SUBNETS)"
    exit 1
fi

# Test 5: Check Aurora Global Cluster exists
echo ""
echo "Test 5: Checking Aurora Global Cluster..."
GLOBAL_CLUSTER=$(aws rds describe-global-clusters \
    --region $PRIMARY_REGION \
    --global-cluster-identifier "global-aurora-$ENVIRONMENT_SUFFIX" \
    --query 'GlobalClusters[0].GlobalClusterIdentifier' \
    --output text 2>/dev/null || echo "None")

if [ "$GLOBAL_CLUSTER" != "None" ] && [ -n "$GLOBAL_CLUSTER" ]; then
    echo "✓ PASS: Aurora Global Cluster exists: $GLOBAL_CLUSTER"
else
    echo "✗ FAIL: Aurora Global Cluster not found"
    exit 1
fi

# Test 6: Check Primary Aurora Cluster exists
echo ""
echo "Test 6: Checking primary Aurora cluster..."
PRIMARY_CLUSTER=$(aws rds describe-db-clusters \
    --region $PRIMARY_REGION \
    --db-cluster-identifier "aurora-primary-$ENVIRONMENT_SUFFIX" \
    --query 'DBClusters[0].Status' \
    --output text 2>/dev/null || echo "None")

if [ "$PRIMARY_CLUSTER" != "None" ] && [ -n "$PRIMARY_CLUSTER" ]; then
    echo "✓ PASS: Primary Aurora cluster exists, status: $PRIMARY_CLUSTER"
else
    echo "✗ FAIL: Primary Aurora cluster not found"
    exit 1
fi

# Test 7: Check DR Aurora Cluster exists
echo ""
echo "Test 7: Checking DR Aurora cluster..."
DR_CLUSTER=$(aws rds describe-db-clusters \
    --region $DR_REGION \
    --db-cluster-identifier "aurora-dr-$ENVIRONMENT_SUFFIX" \
    --query 'DBClusters[0].Status' \
    --output text 2>/dev/null || echo "None")

if [ "$DR_CLUSTER" != "None" ] && [ -n "$DR_CLUSTER" ]; then
    echo "✓ PASS: DR Aurora cluster exists, status: $DR_CLUSTER"
else
    echo "✗ FAIL: DR Aurora cluster not found"
    exit 1
fi

# Test 8: Check Primary ECS Cluster exists
echo ""
echo "Test 8: Checking primary ECS cluster..."
PRIMARY_ECS=$(aws ecs describe-clusters \
    --region $PRIMARY_REGION \
    --clusters "ecs-cluster-primary-$ENVIRONMENT_SUFFIX" \
    --query 'clusters[0].status' \
    --output text 2>/dev/null || echo "None")

if [ "$PRIMARY_ECS" == "ACTIVE" ]; then
    echo "✓ PASS: Primary ECS cluster is active"
else
    echo "✗ FAIL: Primary ECS cluster not active (status: $PRIMARY_ECS)"
    exit 1
fi

# Test 9: Check DR ECS Cluster exists
echo ""
echo "Test 9: Checking DR ECS cluster..."
DR_ECS=$(aws ecs describe-clusters \
    --region $DR_REGION \
    --clusters "ecs-cluster-dr-$ENVIRONMENT_SUFFIX" \
    --query 'clusters[0].status' \
    --output text 2>/dev/null || echo "None")

if [ "$DR_ECS" == "ACTIVE" ]; then
    echo "✓ PASS: DR ECS cluster is active"
else
    echo "✗ FAIL: DR ECS cluster not active (status: $DR_ECS)"
    exit 1
fi

# Test 10: Check Primary ALB exists
echo ""
echo "Test 10: Checking primary Application Load Balancer..."
PRIMARY_ALB=$(aws elbv2 describe-load-balancers \
    --region $PRIMARY_REGION \
    --names "alb-primary-$ENVIRONMENT_SUFFIX" \
    --query 'LoadBalancers[0].State.Code' \
    --output text 2>/dev/null || echo "None")

if [ "$PRIMARY_ALB" == "active" ]; then
    echo "✓ PASS: Primary ALB is active"
else
    echo "✗ FAIL: Primary ALB not active (state: $PRIMARY_ALB)"
    exit 1
fi

# Test 11: Check DR ALB exists
echo ""
echo "Test 11: Checking DR Application Load Balancer..."
DR_ALB=$(aws elbv2 describe-load-balancers \
    --region $DR_REGION \
    --names "alb-dr-$ENVIRONMENT_SUFFIX" \
    --query 'LoadBalancers[0].State.Code' \
    --output text 2>/dev/null || echo "None")

if [ "$DR_ALB" == "active" ]; then
    echo "✓ PASS: DR ALB is active"
else
    echo "✗ FAIL: DR ALB not active (state: $DR_ALB)"
    exit 1
fi

# Test 12: Check Route53 Hosted Zone exists
echo ""
echo "Test 12: Checking Route53 hosted zone..."
HOSTED_ZONE=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='payment-dr-$ENVIRONMENT_SUFFIX.example.com.'].Id | [0]" \
    --output text 2>/dev/null || echo "None")

if [ "$HOSTED_ZONE" != "None" ] && [ -n "$HOSTED_ZONE" ]; then
    echo "✓ PASS: Route53 hosted zone exists: $HOSTED_ZONE"
else
    echo "✗ FAIL: Route53 hosted zone not found"
    exit 1
fi

# Test 13: Check CloudWatch alarms exist
echo ""
echo "Test 13: Checking CloudWatch alarms..."
ALARMS=$(aws cloudwatch describe-alarms \
    --region $PRIMARY_REGION \
    --alarm-name-prefix "aurora-replication-lag-$ENVIRONMENT_SUFFIX" \
    --query 'MetricAlarms | length(@)' \
    --output text 2>/dev/null || echo "0")

if [ "$ALARMS" -gt 0 ]; then
    echo "✓ PASS: CloudWatch alarms exist (found: $ALARMS)"
else
    echo "✗ FAIL: CloudWatch alarms not found"
    exit 1
fi

# Test 14: Check SNS topics exist
echo ""
echo "Test 14: Checking SNS topics..."
SNS_TOPICS=$(aws sns list-topics \
    --region $PRIMARY_REGION \
    --query "Topics[?contains(TopicArn, 'aurora-alarms-$ENVIRONMENT_SUFFIX')] | length(@)" \
    --output text 2>/dev/null || echo "0")

if [ "$SNS_TOPICS" -gt 0 ]; then
    echo "✓ PASS: SNS topics exist"
else
    echo "✗ FAIL: SNS topics not found"
    exit 1
fi

# Test 15: Check resource tagging
echo ""
echo "Test 15: Checking resource tagging..."
VPC_TAGS=$(aws ec2 describe-vpcs \
    --region $PRIMARY_REGION \
    --vpc-ids $PRIMARY_VPC \
    --query 'Vpcs[0].Tags[?Key==`Application`].Value | [0]' \
    --output text 2>/dev/null || echo "None")

if [ "$VPC_TAGS" == "payment-processing" ]; then
    echo "✓ PASS: Resources properly tagged with Application"
else
    echo "✗ FAIL: Resources not properly tagged"
    exit 1
fi

echo ""
echo "========================================="
echo "All integration tests passed!"
echo "========================================="
echo ""
echo "Infrastructure Summary:"
echo "  Primary VPC: $PRIMARY_VPC ($PRIMARY_REGION)"
echo "  DR VPC: $DR_VPC ($DR_REGION)"
echo "  Aurora Global Cluster: $GLOBAL_CLUSTER"
echo "  Primary ECS: ACTIVE"
echo "  DR ECS: ACTIVE"
echo "  Route53 Zone: $HOSTED_ZONE"
