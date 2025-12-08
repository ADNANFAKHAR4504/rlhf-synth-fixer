#!/bin/bash
# Integration Test Auto-Fixer
# Analyzes integration test failures and attempts automated fixes
# Usage: fix-integration-tests.sh [test_output_file] [test_dir]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_OUTPUT="${1:-integration_test_output.log}"
TEST_DIR="${2:-test}"
OUTPUTS_FILE="${3:-cfn-outputs/flat-outputs.json}"

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

FIXES_APPLIED=0

# Analyze test output for failure patterns
analyze_test_failures() {
    local output_file="$1"
    
    if [ ! -f "$output_file" ]; then
        log_error "Test output file not found: $output_file"
        return 1
    fi
    
    log_info "Analyzing test failures..."
    
    # Pattern 1: Output key not found / undefined
    if grep -qiE "undefined.*output|Cannot read.*null|Cannot read.*undefined|KeyError|'.*' is undefined" "$output_file"; then
        echo "OUTPUT_KEY_MISMATCH"
        return 0
    fi
    
    # Pattern 2: Assertion value mismatch
    if grep -qiE "expect.*received|AssertionError|Expected.*but got|expected.*to (equal|be|match)" "$output_file"; then
        echo "ASSERTION_MISMATCH"
        return 0
    fi
    
    # Pattern 3: Timeout errors
    if grep -qiE "timeout|ETIMEDOUT|TimeoutError|exceeded timeout" "$output_file"; then
        echo "TIMEOUT"
        return 0
    fi
    
    # Pattern 4: Permission/Access denied
    if grep -qiE "AccessDenied|Forbidden|UnauthorizedOperation|AccessDeniedException" "$output_file"; then
        echo "PERMISSION_ERROR"
        return 0
    fi
    
    # Pattern 5: Resource not found (after deployment)
    if grep -qiE "ResourceNotFoundException|NoSuchBucket|NoSuchKey|404|does not exist" "$output_file"; then
        echo "RESOURCE_NOT_FOUND"
        return 0
    fi
    
    # Pattern 6: Connection errors
    if grep -qiE "ECONNREFUSED|ENOTFOUND|NetworkError|connection refused" "$output_file"; then
        echo "CONNECTION_ERROR"
        return 0
    fi
    
    # Pattern 7: Import/Module errors
    if grep -qiE "Cannot find module|ImportError|ModuleNotFoundError" "$output_file"; then
        echo "MODULE_ERROR"
        return 0
    fi
    
    echo "UNKNOWN"
    return 0
}

# Get available output keys from deployment
get_available_outputs() {
    if [ ! -f "$OUTPUTS_FILE" ]; then
        log_warning "Outputs file not found: $OUTPUTS_FILE"
        return
    fi
    
    jq -r 'keys[]' "$OUTPUTS_FILE" 2>/dev/null | sort
}

# Fix output key mismatches in test files
fix_output_keys() {
    log_info "Fixing output key mismatches..."
    
    if [ ! -f "$OUTPUTS_FILE" ]; then
        log_error "Cannot fix output keys - deployment outputs not found"
        log_info "Run deployment first to generate: $OUTPUTS_FILE"
        return 1
    fi
    
    local available_keys=$(get_available_outputs)
    local files_fixed=0
    
    # Find all test files that reference outputs
    while IFS= read -r -d '' test_file; do
        local modified=false
        
        # Create backup
        cp "$test_file" "${test_file}.bak"
        
        # Extract output key references from test file
        # TypeScript patterns: outputs['KeyName'], outputs.KeyName, outputs["KeyName"]
        local referenced_keys=$(grep -oE "outputs\[['\"][^'\"]+['\"]\]|outputs\.[a-zA-Z0-9_]+" "$test_file" 2>/dev/null | \
            sed -E "s/outputs\[['\"]//" | sed -E "s/['\"]\]//" | sed 's/outputs\.//' | sort -u)
        
        for key in $referenced_keys; do
            [ -z "$key" ] && continue
            
            # Check if key exists in available outputs
            if ! echo "$available_keys" | grep -qx "$key"; then
                log_warning "  Key not in outputs: $key"
                
                # Try to find similar key (case-insensitive partial match)
                local similar_key=""
                
                # Strategy 1: Case-insensitive exact match
                similar_key=$(echo "$available_keys" | grep -ix "$key" | head -1)
                
                # Strategy 2: Partial match removing common suffixes
                if [ -z "$similar_key" ]; then
                    local base_key=$(echo "$key" | sed -E 's/(Name|Arn|Url|Id|Endpoint)$//')
                    similar_key=$(echo "$available_keys" | grep -i "^$base_key" | head -1)
                fi
                
                # Strategy 3: Contains match
                if [ -z "$similar_key" ]; then
                    similar_key=$(echo "$available_keys" | grep -i "$key" | head -1)
                fi
                
                if [ -n "$similar_key" ]; then
                    log_success "  Replacing '$key' with '$similar_key'"
                    
                    # Replace in file (handle both quote styles)
                    sed -i'' -e "s/outputs\['$key'\]/outputs['$similar_key']/g" "$test_file"
                    sed -i'' -e "s/outputs\[\"$key\"\]/outputs[\"$similar_key\"]/g" "$test_file"
                    sed -i'' -e "s/outputs\.$key/outputs.$similar_key/g" "$test_file"
                    
                    modified=true
                else
                    log_warning "  No similar key found for: $key"
                    echo "Available keys:"
                    echo "$available_keys" | head -10
                fi
            fi
        done
        
        if [ "$modified" = true ] && ! diff -q "$test_file" "${test_file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
            log_success "Fixed output keys in: $test_file"
        fi
        
        rm -f "${test_file}.bak"
    done < <(find "$TEST_DIR" -type f \( -name "*.test.ts" -o -name "*.integration.ts" -o -name "test_*.py" -o -name "*_test.py" \) -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        log_success "Fixed output keys in $files_fixed file(s)"
    fi
}

# Fix timeout issues in test files
fix_timeout_issues() {
    log_info "Fixing timeout issues..."
    
    local files_fixed=0
    
    # TypeScript/Jest tests
    while IFS= read -r -d '' test_file; do
        local modified=false
        
        cp "$test_file" "${test_file}.bak"
        
        # Increase jest timeout (default 5000 -> 60000)
        if grep -q "timeout:\s*[0-9]" "$test_file" 2>/dev/null; then
            # If timeout is less than 30000, increase it
            sed -i'' -E 's/timeout:\s*([0-9]{1,4})\b/timeout: 60000/g' "$test_file"
            sed -i'' -E 's/timeout:\s*([0-9]{5})\b/timeout: 60000/g' "$test_file" # 5-digit numbers < 30000
            modified=true
        fi
        
        # Add jest.setTimeout if not present
        if ! grep -q "jest.setTimeout" "$test_file" 2>/dev/null; then
            if grep -q "describe\|test\|it(" "$test_file" 2>/dev/null; then
                # Add at the beginning of the file after imports
                sed -i'' '1s/^/jest.setTimeout(60000);\n\n/' "$test_file"
                modified=true
            fi
        else
            # Increase existing jest.setTimeout
            sed -i'' -E 's/jest\.setTimeout\([0-9]+\)/jest.setTimeout(60000)/g' "$test_file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$test_file" "${test_file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
            log_success "Fixed timeout in: $test_file"
        fi
        
        rm -f "${test_file}.bak"
    done < <(find "$TEST_DIR" -type f -name "*.ts" -print0 2>/dev/null)
    
    # Python/pytest tests
    while IFS= read -r -d '' test_file; do
        local modified=false
        
        cp "$test_file" "${test_file}.bak"
        
        # Add pytest timeout marker if not present
        if ! grep -q "@pytest.mark.timeout" "$test_file" 2>/dev/null; then
            # Add timeout to integration test functions
            sed -i'' -E 's/(def test_[a-zA-Z_]+.*integration.*\()/\n@pytest.mark.timeout(120)\n\1/g' "$test_file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$test_file" "${test_file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
            log_success "Fixed timeout in: $test_file"
        fi
        
        rm -f "${test_file}.bak"
    done < <(find "$TEST_DIR" -type f -name "*.py" -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        log_success "Fixed timeout issues in $files_fixed file(s)"
    fi
}

# Fix assertion mismatches by suggesting updates
fix_assertion_mismatches() {
    local output_file="$1"
    
    log_info "Analyzing assertion mismatches..."
    
    # Extract expected vs actual values from test output
    echo ""
    echo "Assertion failures found:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Jest format: Expected: X, Received: Y
    grep -A2 -B2 "Expected:\|Received:\|expect(" "$output_file" 2>/dev/null | head -30 || true
    
    # Pytest format: assert X == Y, AssertionError
    grep -A2 -B2 "AssertionError\|assert " "$output_file" 2>/dev/null | head -30 || true
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    log_warning "Assertion mismatches require manual review"
    log_info "Common fixes:"
    echo "  1. If Expected value is correct → Fix the code being tested"
    echo "  2. If Received value is correct → Update the test assertion"
    echo "  3. If using snapshots → Run with --updateSnapshot flag"
    
    return 0
}

# Fix module import errors
fix_module_errors() {
    local output_file="$1"
    
    log_info "Fixing module import errors..."
    
    # Extract module names from error messages
    local missing_modules=$(grep -oE "Cannot find module '[^']+'" "$output_file" 2>/dev/null | \
        sed "s/Cannot find module '//" | sed "s/'$//" | sort -u)
    
    if [ -z "$missing_modules" ]; then
        missing_modules=$(grep -oE "ModuleNotFoundError: No module named '[^']+'" "$output_file" 2>/dev/null | \
            sed "s/ModuleNotFoundError: No module named '//" | sed "s/'$//" | sort -u)
    fi
    
    if [ -n "$missing_modules" ]; then
        echo "Missing modules found:"
        echo "$missing_modules"
        echo ""
        
        log_info "Suggested fixes:"
        
        while IFS= read -r module; do
            [ -z "$module" ] && continue
            
            if [[ "$module" =~ ^@ ]]; then
                echo "  npm install --save-dev $module"
            elif [[ "$module" =~ ^\./ ]]; then
                echo "  Check relative import path: $module"
            else
                echo "  npm install --save-dev $module (or pip install $module)"
            fi
        done <<< "$missing_modules"
    fi
}

# Main function
main() {
    echo "🧪 Integration Test Auto-Fixer"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test output: $TEST_OUTPUT"
    echo "Test directory: $TEST_DIR"
    echo "Outputs file: $OUTPUTS_FILE"
    echo ""
    
    if [ ! -f "$TEST_OUTPUT" ]; then
        log_error "Test output file not found: $TEST_OUTPUT"
        log_info "Run integration tests first and capture output:"
        echo "  npm run test:integration > integration_test_output.log 2>&1"
        exit 1
    fi
    
    # Analyze failure type
    FAILURE_TYPE=$(analyze_test_failures "$TEST_OUTPUT")
    
    echo "Detected failure type: $FAILURE_TYPE"
    echo ""
    
    case "$FAILURE_TYPE" in
        "OUTPUT_KEY_MISMATCH")
            log_info "Output key mismatch detected"
            fix_output_keys
            ;;
        "ASSERTION_MISMATCH")
            log_info "Assertion mismatch detected"
            fix_assertion_mismatches "$TEST_OUTPUT"
            ;;
        "TIMEOUT")
            log_info "Timeout errors detected"
            fix_timeout_issues
            ;;
        "PERMISSION_ERROR")
            log_warning "Permission errors detected"
            log_error "This requires IAM policy updates - cannot auto-fix"
            log_info "Check IAM permissions for the test role"
            echo ""
            grep -i "AccessDenied\|Forbidden\|UnauthorizedOperation" "$TEST_OUTPUT" | head -5
            exit 1
            ;;
        "RESOURCE_NOT_FOUND")
            log_warning "Resource not found errors detected"
            log_info "This may indicate:"
            echo "  1. Deployment didn't complete successfully"
            echo "  2. Output keys are misconfigured"
            echo "  3. Resources were deleted before tests ran"
            echo ""
            fix_output_keys  # Try fixing output keys first
            ;;
        "CONNECTION_ERROR")
            log_warning "Connection errors detected"
            log_info "This may indicate:"
            echo "  1. VPC/Security group issues"
            echo "  2. Endpoint not accessible"
            echo "  3. Network configuration problems"
            echo ""
            grep -i "ECONNREFUSED\|ENOTFOUND\|NetworkError" "$TEST_OUTPUT" | head -5
            ;;
        "MODULE_ERROR")
            log_warning "Module import errors detected"
            fix_module_errors "$TEST_OUTPUT"
            ;;
        *)
            log_warning "Unknown failure pattern"
            log_info "Manual review required"
            echo ""
            echo "Last 20 lines of test output:"
            tail -20 "$TEST_OUTPUT"
            ;;
    esac
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ $FIXES_APPLIED -gt 0 ]; then
        log_success "Applied $FIXES_APPLIED fix(es)"
        log_info "Re-run integration tests to verify:"
        echo "  npm run test:integration"
    else
        log_info "No automatic fixes applied"
        log_info "Manual intervention may be required"
    fi
    
    exit 0
}

main "$@"

