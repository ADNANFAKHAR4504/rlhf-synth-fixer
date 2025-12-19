#!/bin/bash
# Test script to verify critical issue detection patterns
# This script simulates the detection logic to verify patterns work correctly

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}✅ PASS: $1${NC}"; }
log_fail() { echo -e "${RED}❌ FAIL: $1${NC}"; }
log_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_critical_pattern() {
    local test_name="$1"
    local test_content="$2"
    local should_detect="$3"  # true or false
    
    echo "$test_content" > test_comment.txt
    
    # Run detection logic
    CRITICAL_FOUND=false
    
    if grep -q "❌ CRITICAL:" test_comment.txt; then
        CRITICAL_FOUND=true
    fi
    
    if grep -q "Exit with code 1 to fail the job" test_comment.txt; then
        CRITICAL_FOUND=true
    fi
    
    if grep -q "validation FAILED" test_comment.txt; then
        CRITICAL_FOUND=true
    fi
    
    if grep -q "BLOCKED:" test_comment.txt; then
        CRITICAL_FOUND=true
    fi
    
    if grep -q "Metadata validation FAILED" test_comment.txt; then
        CRITICAL_FOUND=true
    fi
    
    # Check result
    if [ "$should_detect" = "true" ] && [ "$CRITICAL_FOUND" = "true" ]; then
        log_pass "$test_name"
        ((TESTS_PASSED++))
    elif [ "$should_detect" = "false" ] && [ "$CRITICAL_FOUND" = "false" ]; then
        log_pass "$test_name"
        ((TESTS_PASSED++))
    else
        log_fail "$test_name (Expected: $should_detect, Got: $CRITICAL_FOUND)"
        ((TESTS_FAILED++))
    fi
    
    rm -f test_comment.txt
}

echo ""
log_info "Testing Critical Issue Detection Patterns"
echo "=========================================="
echo ""

# Test 1: Should detect CRITICAL marker
test_critical_pattern "Detect ❌ CRITICAL: marker" \
"❌ CRITICAL: Missing required field: platform" \
"true"

# Test 2: Should detect exit 1 request
test_critical_pattern "Detect exit 1 request" \
"Post a PR comment with detailed validation results and fix instructions
2. Then: Execute exit 1 to fail the job immediately
3. Do NOT proceed with code review until metadata is fixed" \
"true"

# Test 3: Should detect validation FAILED
test_critical_pattern "Detect validation FAILED" \
"Running metadata validation...
❌ Invalid platform: 'terraform'
Metadata validation FAILED with 3 error(s)" \
"true"

# Test 4: Should detect BLOCKED status
test_critical_pattern "Detect BLOCKED status" \
"❌ BLOCKED: Files in wrong locations will FAIL CI/CD
List violating files and correct locations" \
"true"

# Test 5: Should detect Metadata validation FAILED
test_critical_pattern "Detect Metadata validation FAILED output" \
"Validating metadata.json...
❌ Missing required field: subtask
❌ Metadata validation FAILED with 1 error(s)" \
"true"

# Test 6: Should NOT detect in clean review
test_critical_pattern "Clean review (no critical issues)" \
"## Code Review Summary

### Validation Results
- ✅ Platform/Language: pulumi-ts
- ✅ PROMPT Style: human-written
- ✅ environmentSuffix: 100%
- ✅ AWS Services: 3/3 services
- ✅ Training Quality: 9/10

SCORE:9" \
"false"

# Test 7: Should NOT false positive on mentions
test_critical_pattern "No false positive on 'critical' in context" \
"The application uses critical resources like RDS and Lambda.
All security practices are critical for production deployment.
Training Quality: 8/10

SCORE:8" \
"false"

# Test 8: Should detect critical in mixed content
test_critical_pattern "Detect critical in mixed review" \
"## Validation Results

Platform: cdk-ts ✅
Complexity: hard ✅

## Critical Issues Found

❌ CRITICAL: Invalid subject_labels for subtask 'Provisioning of Infrastructure Environments'

The following labels are invalid:
- 'Invalid Label Here'

Valid subject_labels are:
- Cloud Environment Setup
- Multi-Environment IaC Provisioning

SCORE:3" \
"true"

echo ""
echo "=========================================="
echo "Test Results:"
echo "  Passed: $TESTS_PASSED"
echo "  Failed: $TESTS_FAILED"
echo "=========================================="
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_pass "All tests passed!"
    exit 0
else
    log_fail "$TESTS_FAILED test(s) failed"
    exit 1
fi

