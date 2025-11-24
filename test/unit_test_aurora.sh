#!/bin/bash
# Unit Tests for Aurora Module
# Tests Aurora Global Database module configuration

set -e

echo "========================================="
echo "Aurora Module Unit Tests"
echo "========================================="

# Test 1: Aurora module exists
echo ""
echo "Test 1: Checking Aurora module exists..."
if [ -d "lib/modules/aurora" ]; then
    echo "✓ PASS: Aurora module directory exists"
else
    echo "✗ FAIL: Aurora module directory not found"
    exit 1
fi

# Test 2: Aurora module has required files
echo ""
echo "Test 2: Checking Aurora module files..."
for file in main.tf variables.tf outputs.tf; do
    if [ -f "lib/modules/aurora/$file" ]; then
        echo "✓ PASS: $file exists"
    else
        echo "✗ FAIL: $file not found"
        exit 1
    fi
done

# Test 3: Global cluster defined
echo ""
echo "Test 3: Checking for Aurora Global Cluster..."
if grep -q 'resource "aws_rds_global_cluster"' lib/modules/aurora/main.tf; then
    echo "✓ PASS: Aurora Global Cluster defined"
else
    echo "✗ FAIL: Aurora Global Cluster not found"
    exit 1
fi

# Test 4: Primary cluster defined
echo ""
echo "Test 4: Checking for primary Aurora cluster..."
if grep -q 'resource "aws_rds_cluster" "primary"' lib/modules/aurora/main.tf; then
    echo "✓ PASS: Primary Aurora cluster defined"
else
    echo "✗ FAIL: Primary Aurora cluster not found"
    exit 1
fi

# Test 5: DR cluster defined
echo ""
echo "Test 5: Checking for DR Aurora cluster..."
if grep -q 'resource "aws_rds_cluster" "dr"' lib/modules/aurora/main.tf; then
    echo "✓ PASS: DR Aurora cluster defined"
else
    echo "✗ FAIL: DR Aurora cluster not found"
    exit 1
fi

# Test 6: Backup retention configured
echo ""
echo "Test 6: Checking backup retention..."
if grep -q 'backup_retention_period.*=.*7' lib/modules/aurora/main.tf; then
    echo "✓ PASS: 7-day backup retention configured"
else
    echo "✗ FAIL: Backup retention not properly configured"
    exit 1
fi

# Test 7: Skip final snapshot enabled
echo ""
echo "Test 7: Checking skip_final_snapshot..."
if grep -q 'skip_final_snapshot.*=.*true' lib/modules/aurora/main.tf; then
    echo "✓ PASS: skip_final_snapshot = true"
else
    echo "✗ FAIL: skip_final_snapshot not set to true"
    exit 1
fi

# Test 8: Deletion protection disabled
echo ""
echo "Test 8: Checking deletion_protection..."
if grep -q 'deletion_protection.*=.*false' lib/modules/aurora/main.tf; then
    echo "✓ PASS: deletion_protection = false"
else
    echo "✗ FAIL: deletion_protection not set to false"
    exit 1
fi

# Test 9: Replication lag alarm configured
echo ""
echo "Test 9: Checking replication lag alarm..."
if grep -q 'AuroraGlobalDBReplicationLag' lib/modules/aurora/main.tf; then
    echo "✓ PASS: Replication lag alarm configured"
else
    echo "✗ FAIL: Replication lag alarm not found"
    exit 1
fi

# Test 10: PostgreSQL engine
echo ""
echo "Test 10: Checking Aurora PostgreSQL engine..."
if grep -q 'aurora-postgresql' lib/modules/aurora/main.tf; then
    echo "✓ PASS: Aurora PostgreSQL engine configured"
else
    echo "✗ FAIL: Aurora PostgreSQL not configured"
    exit 1
fi

# Test 11: Storage encryption enabled
echo ""
echo "Test 11: Checking storage encryption..."
if grep -q 'storage_encrypted.*=.*true' lib/modules/aurora/main.tf; then
    echo "✓ PASS: Storage encryption enabled"
else
    echo "✗ FAIL: Storage encryption not enabled"
    exit 1
fi

# Test 12: SNS topic for alarms
echo ""
echo "Test 12: Checking SNS topic for alarms..."
if grep -q 'resource "aws_sns_topic"' lib/modules/aurora/main.tf; then
    echo "✓ PASS: SNS topic configured"
else
    echo "✗ FAIL: SNS topic not found"
    exit 1
fi

# Test 13: DB subnet groups for both regions
echo ""
echo "Test 13: Checking DB subnet groups..."
if grep -q 'resource "aws_db_subnet_group" "primary"' lib/modules/aurora/main.tf && \
   grep -q 'resource "aws_db_subnet_group" "dr"' lib/modules/aurora/main.tf; then
    echo "✓ PASS: DB subnet groups defined for both regions"
else
    echo "✗ FAIL: DB subnet groups missing"
    exit 1
fi

# Test 14: Environment suffix usage
echo ""
echo "Test 14: Checking environment_suffix usage..."
if grep -q 'var.environment_suffix' lib/modules/aurora/main.tf; then
    echo "✓ PASS: environment_suffix used in resource naming"
else
    echo "✗ FAIL: environment_suffix not used"
    exit 1
fi

echo ""
echo "========================================="
echo "All Aurora module tests passed!"
echo "========================================="
