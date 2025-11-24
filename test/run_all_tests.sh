#!/bin/bash
# Master Test Runner
# Runs all unit and validation tests for the DR infrastructure

set -e

echo "========================================="
echo "Multi-Region DR Infrastructure Test Suite"
echo "========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILED_TESTS=0
PASSED_TESTS=0

# Make all test scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Function to run a test script
run_test() {
    local test_script="$1"
    local test_name="$2"

    echo ""
    echo "========================================="
    echo "Running: $test_name"
    echo "========================================="

    if bash "$SCRIPT_DIR/$test_script"; then
        echo "✓ $test_name: PASSED"
        ((PASSED_TESTS++))
    else
        echo "✗ $test_name: FAILED"
        ((FAILED_TESTS++))
    fi
}

# Run all unit tests
echo "PHASE 1: Unit Tests"
echo "========================================="

run_test "terraform_validation_test.sh" "Terraform Validation Tests"
run_test "unit_test_vpc.sh" "VPC Module Tests"
run_test "unit_test_aurora.sh" "Aurora Module Tests"
run_test "unit_test_ecs.sh" "ECS Module Tests"
run_test "unit_test_route53.sh" "Route53 Module Tests"

# Summary
echo ""
echo "========================================="
echo "Test Suite Summary"
echo "========================================="
echo "Total tests passed: $PASSED_TESTS"
echo "Total tests failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "✓ ALL TESTS PASSED!"
    echo ""
    echo "Infrastructure code is ready for deployment."
    echo ""
    echo "To deploy:"
    echo "  1. cd lib"
    echo "  2. terraform init"
    echo "  3. terraform plan -var='environment_suffix=test-12345'"
    echo "  4. terraform apply -var='environment_suffix=test-12345'"
    echo ""
    echo "To run integration tests after deployment:"
    echo "  bash test/integration_test.sh test-12345"
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    echo ""
    echo "Please review and fix the failing tests before deployment."
    exit 1
fi
