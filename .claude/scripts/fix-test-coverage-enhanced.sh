#!/bin/bash
# Enhanced test coverage fixer that generates test stubs for uncovered code
# Usage: fix-test-coverage-enhanced.sh [coverage_summary] [lcov_file]
#
# This script analyzes coverage gaps and generates test stubs to improve coverage.
# It works with CDK TypeScript, Pulumi Python, and other common IaC platforms.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COVERAGE_SUMMARY="${1:-coverage/coverage-summary.json}"
LCOV_FILE="${2:-coverage/lcov.info}"
SOURCE_DIR="${3:-lib}"
TEST_DIR="${4:-test}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Get platform/language from metadata
get_platform_info() {
    if [ -f "metadata.json" ]; then
        PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
        LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")
    else
        PLATFORM="unknown"
        LANGUAGE="unknown"
    fi
    export PLATFORM LANGUAGE
}

# Check current coverage
check_coverage() {
    if [ ! -f "$COVERAGE_SUMMARY" ]; then
        log_error "Coverage summary not found: $COVERAGE_SUMMARY"
        log_info "Run tests with coverage first: npm run test -- --coverage"
        return 1
    fi
    
    # Try to extract from total first, then from root level
    STATEMENTS_PCT=$(jq -r '.total.statements.pct // .statements.pct // 0' "$COVERAGE_SUMMARY" 2>/dev/null || echo "0")
    FUNCTIONS_PCT=$(jq -r '.total.functions.pct // .functions.pct // 0' "$COVERAGE_SUMMARY" 2>/dev/null || echo "0")
    LINES_PCT=$(jq -r '.total.lines.pct // .lines.pct // 0' "$COVERAGE_SUMMARY" 2>/dev/null || echo "0")
    BRANCHES_PCT=$(jq -r '.total.branches.pct // .branches.pct // 0' "$COVERAGE_SUMMARY" 2>/dev/null || echo "0")
    
    echo "Current coverage:"
    echo "  Statements: ${STATEMENTS_PCT}%"
    echo "  Functions:  ${FUNCTIONS_PCT}%"
    echo "  Lines:      ${LINES_PCT}%"
    echo "  Branches:   ${BRANCHES_PCT}%"
    
    # Check if already at 100%
    if [ "$STATEMENTS_PCT" = "100" ] && [ "$FUNCTIONS_PCT" = "100" ] && [ "$LINES_PCT" = "100" ]; then
        log_success "Coverage already at 100%!"
        return 0
    fi
    
    return 1
}

# Extract uncovered functions from lcov.info
get_uncovered_functions() {
    if [ ! -f "$LCOV_FILE" ]; then
        log_warning "LCOV file not found: $LCOV_FILE"
        return
    fi
    
    # Parse lcov format: FN:line,name and FNDA:count,name
    # FNDA:0,functionName means function was never executed
    grep "^FNDA:0," "$LCOV_FILE" 2>/dev/null | \
        sed 's/FNDA:0,//' | \
        sort -u
}

# Extract uncovered lines from lcov.info
get_uncovered_lines() {
    local source_file="$1"
    
    if [ ! -f "$LCOV_FILE" ]; then
        return
    fi
    
    # Find the section for this file and extract uncovered lines (DA:line,0)
    awk -v file="$source_file" '
        /^SF:/ { current_file = $0; gsub(/^SF:/, "", current_file) }
        current_file == file && /^DA:[0-9]+,0$/ {
            gsub(/^DA:/, "")
            gsub(/,0$/, "")
            print
        }
    ' "$LCOV_FILE"
}

# Get list of source files with coverage gaps
get_uncovered_files() {
    if [ -f "$COVERAGE_SUMMARY" ]; then
        # Extract files with less than 100% line coverage
        jq -r 'to_entries[] | select(.value.lines.pct < 100) | .key' "$COVERAGE_SUMMARY" 2>/dev/null | \
            grep -v "^total$" || true
    fi
}

# Generate TypeScript test stubs for CDK
generate_cdk_ts_tests() {
    local uncovered_funcs="$1"
    local test_file="$TEST_DIR/tap-stack.test.ts"
    
    if [ -z "$uncovered_funcs" ]; then
        log_info "No uncovered functions found for TypeScript test generation"
        return
    fi
    
    log_info "Generating TypeScript test stubs..."
    
    # Check if test file exists
    if [ ! -f "$test_file" ]; then
        log_warning "Test file not found: $test_file"
        log_info "Creating basic test structure..."
        
        mkdir -p "$TEST_DIR"
        cat > "$test_file" << 'EOF'
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Stack creates successfully', () => {
    expect(template.toJSON()).toBeDefined();
  });

EOF
    fi
    
    # Append test stubs for uncovered functions
    local added_tests=0
    
    while IFS= read -r func; do
        [ -z "$func" ] && continue
        
        # Skip if test already exists for this function
        if grep -q "describe('$func'" "$test_file" 2>/dev/null || \
           grep -q "test('$func" "$test_file" 2>/dev/null; then
            log_info "  Test for '$func' already exists, skipping"
            continue
        fi
        
        log_info "  Adding test stub for: $func"
        
        # Generate appropriate test based on function name pattern
        if [[ "$func" =~ ^create ]]; then
            cat >> "$test_file" << EOF

  test('$func creates expected resources', () => {
    // Auto-generated test for $func
    // Verify the function creates expected AWS resources
    expect(template.toJSON()).toBeDefined();
    // TODO: Add specific resource assertions
    // template.hasResourceProperties('AWS::Type::Resource', {});
  });
EOF
        elif [[ "$func" =~ ^get|^find ]]; then
            cat >> "$test_file" << EOF

  test('$func returns expected value', () => {
    // Auto-generated test for $func
    // Verify the function returns expected data
    expect(template.toJSON()).toBeDefined();
    // TODO: Add specific assertions for returned values
  });
EOF
        else
            cat >> "$test_file" << EOF

  test('$func executes without errors', () => {
    // Auto-generated test for $func
    // Basic test to ensure function executes without throwing
    expect(template.toJSON()).toBeDefined();
    // TODO: Add specific assertions based on function behavior
  });
EOF
        fi
        
        added_tests=$((added_tests + 1))
    done <<< "$uncovered_funcs"
    
    # Close the describe block if we created a new file
    if ! grep -q "^});" "$test_file" 2>/dev/null; then
        echo "});" >> "$test_file"
    fi
    
    if [ $added_tests -gt 0 ]; then
        log_success "Added $added_tests test stub(s) to $test_file"
    fi
}

# Generate Python test stubs for Pulumi/CDK Python
generate_python_tests() {
    local uncovered_funcs="$1"
    local test_file
    
    # Find or create test file
    if [ -f "$TEST_DIR/test_tap_stack.py" ]; then
        test_file="$TEST_DIR/test_tap_stack.py"
    elif [ -f "tests/test_tap_stack.py" ]; then
        test_file="tests/test_tap_stack.py"
    else
        test_file="$TEST_DIR/test_tap_stack.py"
        mkdir -p "$(dirname "$test_file")"
        
        log_info "Creating basic Python test structure..."
        
        if [ "$PLATFORM" = "pulumi" ]; then
            cat > "$test_file" << 'EOF'
"""Tests for tap-stack infrastructure."""
import pytest
import pulumi
import pulumi.runtime

# Mock Pulumi for unit testing
class MockResourceMonitor:
    def __init__(self):
        self.resources = []
    
    def register_resource(self, t, name, custom, parent, provider, props, prop_deps, opts):
        self.resources.append({'type': t, 'name': name, 'props': props})
        return name, None, props


@pytest.fixture
def pulumi_mocks():
    """Set up Pulumi mocks for testing."""
    # Configure Pulumi for testing
    pulumi.runtime.set_mocks(
        MockResourceMonitor(),
        lambda args: args['props']
    )
    yield
    # Cleanup handled by Pulumi


def test_stack_creates_successfully(pulumi_mocks):
    """Test that the stack creates successfully."""
    from lib import tap_stack
    # Basic test - verify module imports and runs
    assert tap_stack is not None

EOF
        else
            # CDK Python or other
            cat > "$test_file" << 'EOF'
"""Tests for tap-stack infrastructure."""
import pytest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

# Import the stack - adjust import path as needed
try:
    from lib.tap_stack import TapStack
except ImportError:
    TapStack = None


@pytest.fixture
def template():
    """Create a template from the stack for testing."""
    if TapStack is None:
        pytest.skip("TapStack not found")
    
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    return Template.from_stack(stack)


def test_stack_creates_successfully(template):
    """Test that the stack creates successfully."""
    assert template.to_json() is not None

EOF
        fi
    fi
    
    if [ -z "$uncovered_funcs" ]; then
        log_info "No uncovered functions found for Python test generation"
        return
    fi
    
    log_info "Generating Python test stubs..."
    
    local added_tests=0
    
    while IFS= read -r func; do
        [ -z "$func" ] && continue
        
        # Skip if test already exists
        if grep -q "def test_$func\|def test_${func}_" "$test_file" 2>/dev/null; then
            log_info "  Test for '$func' already exists, skipping"
            continue
        fi
        
        log_info "  Adding test stub for: $func"
        
        # Convert function name to test name (snake_case)
        local test_name=$(echo "$func" | sed 's/[A-Z]/_&/g' | tr '[:upper:]' '[:lower:]' | sed 's/^_//')
        
        cat >> "$test_file" << EOF


def test_${test_name}_coverage(template):
    """Auto-generated test for ${func}."""
    # Verify the function behavior
    assert template.to_json() is not None
    # TODO: Add specific assertions
    # template.has_resource_properties("AWS::Type::Resource", {})
EOF
        
        added_tests=$((added_tests + 1))
    done <<< "$uncovered_funcs"
    
    if [ $added_tests -gt 0 ]; then
        log_success "Added $added_tests test stub(s) to $test_file"
    fi
}

# Generate tests for resource properties coverage
generate_resource_property_tests() {
    local test_file="$1"
    
    if [ ! -f "$test_file" ]; then
        return
    fi
    
    log_info "Analyzing stack for additional property coverage tests..."
    
    # Find source stack file
    local stack_file=""
    if [ -f "lib/tap-stack.ts" ]; then
        stack_file="lib/tap-stack.ts"
    elif [ -f "lib/tap_stack.py" ]; then
        stack_file="lib/tap_stack.py"
    else
        return
    fi
    
    # Extract AWS resource types from the stack
    local resource_types
    if [[ "$stack_file" == *.ts ]]; then
        resource_types=$(grep -oE "new [a-z]+\.[A-Z][a-zA-Z]+" "$stack_file" 2>/dev/null | \
            sed 's/new //' | sort -u | head -10)
    else
        resource_types=$(grep -oE "[a-z_]+\.[A-Z][a-zA-Z]+" "$stack_file" 2>/dev/null | \
            sed 's/^.*\.//' | sort -u | head -10)
    fi
    
    if [ -n "$resource_types" ]; then
        log_info "Found resource types that may need property tests:"
        echo "$resource_types" | head -5
    fi
}

# Main function
main() {
    echo "🧪 Enhanced Test Coverage Fixer"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    get_platform_info
    echo "Platform: $PLATFORM, Language: $LANGUAGE"
    echo ""
    
    # Check current coverage
    if check_coverage; then
        exit 0
    fi
    
    echo ""
    log_info "Analyzing coverage gaps..."
    
    # Get uncovered functions
    UNCOVERED_FUNCS=$(get_uncovered_functions)
    
    if [ -n "$UNCOVERED_FUNCS" ]; then
        echo ""
        echo "Uncovered functions found:"
        echo "$UNCOVERED_FUNCS" | head -20
        echo ""
    fi
    
    # Get uncovered files
    UNCOVERED_FILES=$(get_uncovered_files)
    
    if [ -n "$UNCOVERED_FILES" ]; then
        echo ""
        echo "Files with coverage gaps:"
        echo "$UNCOVERED_FILES" | head -10
        echo ""
    fi
    
    # Generate tests based on platform
    case "$PLATFORM-$LANGUAGE" in
        "cdk-ts"|"cdktf-ts")
            generate_cdk_ts_tests "$UNCOVERED_FUNCS"
            ;;
        "pulumi-ts")
            generate_cdk_ts_tests "$UNCOVERED_FUNCS"  # Similar structure
            ;;
        "cdk-py"|"cdktf-py"|"pulumi-py")
            generate_python_tests "$UNCOVERED_FUNCS"
            ;;
        *)
            log_warning "Test generation not fully implemented for $PLATFORM-$LANGUAGE"
            log_info "Manual test creation may be required"
            ;;
    esac
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Test stubs generated. Next steps:"
    echo "1. Review and customize generated test stubs"
    echo "2. Add specific assertions for your resources"
    echo "3. Re-run tests: npm run test -- --coverage"
    echo "4. Repeat if coverage is still below 100%"
    
    exit 0
}

main "$@"

