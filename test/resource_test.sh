#!/bin/bash
# Resource Configuration Test Suite
# Validates specific resource configurations

set -e

echo "=========================================="
echo "Resource Configuration Test Suite"
echo "=========================================="

cd "$(dirname "$0")/../lib"

# Test 1: ECS Cluster Container Insights
echo ""
echo "Test 1: Checking ECS Container Insights..."
if grep -A 2 "aws_ecs_cluster" ecs.tf | grep "containerInsights" | grep "enabled" > /dev/null; then
    echo "PASS: ECS Container Insights is enabled"
else
    echo "FAIL: ECS Container Insights is not enabled"
    exit 1
fi

# Test 2: Microservices Count
echo ""
echo "Test 2: Checking microservices count..."
count=$(grep -c "payment-api\|fraud-detection\|notification-service\|audit-logger\|webhook-processor" variables.tf)
if [ $count -ge 5 ]; then
    echo "PASS: All 5 microservices are defined"
else
    echo "FAIL: Not all microservices are defined (found $count)"
    exit 1
fi

# Test 3: Auto-scaling Configuration
echo ""
echo "Test 3: Checking auto-scaling configuration..."
if grep "cpu_target_value" variables.tf > /dev/null && \
   grep "scale_down_cpu_threshold" variables.tf > /dev/null; then
    echo "PASS: Auto-scaling thresholds are configured"
else
    echo "FAIL: Auto-scaling thresholds are missing"
    exit 1
fi

# Test 4: ECR Lifecycle Policy
echo ""
echo "Test 4: Checking ECR lifecycle policy..."
if grep "ecr_image_retention_count" variables.tf > /dev/null && \
   grep "aws_ecr_lifecycle_policy" ecr.tf > /dev/null; then
    echo "PASS: ECR lifecycle policy is configured"
else
    echo "FAIL: ECR lifecycle policy is missing"
    exit 1
fi

# Test 5: CloudWatch Log Retention
echo ""
echo "Test 5: Checking CloudWatch log retention..."
if grep "log_retention_days" variables.tf > /dev/null && \
   grep "retention_in_days" ecs.tf > /dev/null; then
    echo "PASS: CloudWatch log retention is configured"
else
    echo "FAIL: CloudWatch log retention is missing"
    exit 1
fi

# Test 6: AWS App Mesh
echo ""
echo "Test 6: Checking AWS App Mesh configuration..."
if [ -f "appmesh.tf" ] && \
   grep "aws_appmesh_mesh" appmesh.tf > /dev/null && \
   grep "aws_appmesh_virtual_node" appmesh.tf > /dev/null; then
    echo "PASS: AWS App Mesh is configured"
else
    echo "FAIL: AWS App Mesh configuration is incomplete"
    exit 1
fi

# Test 7: IAM Roles
echo ""
echo "Test 7: Checking IAM roles..."
if grep "aws_iam_role" iam.tf > /dev/null && \
   grep "ecs_task_execution" iam.tf > /dev/null && \
   grep "ecs_task_role" iam.tf > /dev/null; then
    echo "PASS: IAM roles are configured"
else
    echo "FAIL: IAM roles are missing"
    exit 1
fi

# Test 8: Secrets Manager
echo ""
echo "Test 8: Checking Secrets Manager..."
if [ -f "secrets.tf" ] && \
   grep "aws_secretsmanager_secret" secrets.tf > /dev/null; then
    echo "PASS: Secrets Manager is configured"
else
    echo "FAIL: Secrets Manager configuration is missing"
    exit 1
fi

# Test 9: Multi-AZ Deployment
echo ""
echo "Test 9: Checking multi-AZ deployment..."
if grep "availability_zones" variables.tf > /dev/null; then
    az_count=$(grep -A 3 "availability_zones" variables.tf | grep "us-east-1" | wc -l)
    if [ $az_count -ge 3 ]; then
        echo "PASS: Multi-AZ deployment configured (3+ zones)"
    else
        echo "FAIL: Not enough availability zones ($az_count found, need 3)"
        exit 1
    fi
else
    echo "FAIL: Availability zones not configured"
    exit 1
fi

# Test 10: Health Check Grace Period
echo ""
echo "Test 10: Checking ECS service health check grace period..."
if grep "health_check_grace_period_seconds" ecs.tf > /dev/null; then
    echo "PASS: Health check grace period is configured"
else
    echo "FAIL: Health check grace period is missing"
    exit 1
fi

# Test 11: Application Load Balancer
echo ""
echo "Test 11: Checking Application Load Balancer..."
if [ -f "alb.tf" ] && \
   grep "aws_lb" alb.tf > /dev/null && \
   grep "aws_lb_target_group" alb.tf > /dev/null && \
   grep "aws_lb_listener_rule" alb.tf > /dev/null; then
    echo "PASS: ALB configuration is complete"
else
    echo "FAIL: ALB configuration is incomplete"
    exit 1
fi

# Test 12: Fargate Launch Type
echo ""
echo "Test 12: Checking Fargate launch type..."
if grep "launch_type.*FARGATE" ecs.tf > /dev/null && \
   grep "requires_compatibilities.*FARGATE" ecs.tf > /dev/null; then
    echo "PASS: Fargate launch type is configured"
else
    echo "FAIL: Fargate launch type is not properly configured"
    exit 1
fi

echo ""
echo "=========================================="
echo "All resource tests passed successfully!"
echo "=========================================="
