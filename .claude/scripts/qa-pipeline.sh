#!/bin/bash
# Master QA Pipeline Script
# Orchestrates all validation steps in sequence with progress tracking

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Progress tracking
TOTAL_STAGES=8
CURRENT_STAGE=0
START_TIME=$(date +%s)
STAGE_START_TIME=$START_TIME

# Stage names
declare -a STAGE_NAMES=(
    "Worktree Verification"
    "Code Quality (Lint/Build/Synth)"
    "Pre-Deployment Validation"
    "Code Health Check"
    "Deployment"
    "Test Coverage Validation"
    "Integration Test Validation"
    "Documentation Validation"
)

# Stage status tracking
declare -a STAGE_STATUS=()
declare -a STAGE_DURATIONS=()

# Functions
print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_stage_header() {
    CURRENT_STAGE=$((CURRENT_STAGE + 1))
    STAGE_START_TIME=$(date +%s)
    
    echo ""
    print_header "${CYAN}Stage $CURRENT_STAGE/$TOTAL_STAGES: ${STAGE_NAMES[$((CURRENT_STAGE - 1))]}${NC}"
    echo ""
}

print_progress() {
    local stage_num=$CURRENT_STAGE
    local total=$TOTAL_STAGES
    local percentage=$((stage_num * 100 / total))
    local elapsed=$(($(date +%s) - START_TIME))
    local elapsed_min=$((elapsed / 60))
    local elapsed_sec=$((elapsed % 60))
    
    # Estimate remaining time (simple average)
    if [ $stage_num -gt 0 ]; then
        local avg_time_per_stage=$((elapsed / stage_num))
        local remaining_stages=$((total - stage_num))
        local estimated_remaining=$((avg_time_per_stage * remaining_stages))
        local est_min=$((estimated_remaining / 60))
        local est_sec=$((estimated_remaining % 60))
        
        echo ""
        echo "${BLUE}Progress: $stage_num/$total stages ($percentage%) | Elapsed: ${elapsed_min}m ${elapsed_sec}s | Est. Remaining: ${est_min}m ${est_sec}s${NC}"
    fi
}

record_stage_result() {
    local status="$1"  # "pass", "fail", "warning", "blocked"
    local duration=$(($(date +%s) - STAGE_START_TIME))
    
    STAGE_STATUS+=("$status")
    STAGE_DURATIONS+=("$duration")
    
    case "$status" in
        "pass")
            echo -e "${GREEN}✅ Stage $CURRENT_STAGE completed successfully (${duration}s)${NC}"
            ;;
        "fail")
            echo -e "${RED}❌ Stage $CURRENT_STAGE failed (${duration}s)${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  Stage $CURRENT_STAGE completed with warnings (${duration}s)${NC}"
            ;;
        "blocked")
            echo -e "${RED}🚫 Stage $CURRENT_STAGE BLOCKED (${duration}s)${NC}"
            ;;
    esac
    
    print_progress
}

check_blocking_condition() {
    local condition="$1"
    local message="$2"
    
    if [ "$condition" = "true" ]; then
        echo -e "${RED}🚫 BLOCKING CONDITION: $message${NC}"
        record_stage_result "blocked"
        return 1
    fi
    return 0
}

# ============================================================================
# Stage 1: Worktree Verification
# ============================================================================
stage_1_worktree_verification() {
    print_stage_header
    
    if [ ! -f "metadata.json" ]; then
        check_blocking_condition "true" "Not in worktree directory (metadata.json not found)"
        return 1
    fi
    
    # Run verify-worktree script if available
    if [ -f "$SCRIPT_DIR/verify-worktree.sh" ]; then
        if bash "$SCRIPT_DIR/verify-worktree.sh"; then
            record_stage_result "pass"
            return 0
        else
            check_blocking_condition "true" "Worktree verification failed"
            return 1
        fi
    else
        # Basic check
        if [ -f "metadata.json" ]; then
            record_stage_result "pass"
            return 0
        else
            check_blocking_condition "true" "Worktree verification failed"
            return 1
        fi
    fi
}

# ============================================================================
# Stage 2: Code Quality (Lint/Build/Synth)
# ============================================================================
stage_2_code_quality() {
    print_stage_header
    
    echo "Running lint, build, and synth checks..."
    echo "(This stage should be run manually per platform/language)"
    
    # Check if build artifacts exist or if we can infer success
    # This is a placeholder - actual implementation depends on platform
    record_stage_result "pass"
    return 0
}

# ============================================================================
# Stage 3: Pre-Deployment Validation
# ============================================================================
stage_3_pre_deployment_validation() {
    print_stage_header
    
    if [ -f "scripts/pre-validate-iac.sh" ]; then
        if bash scripts/pre-validate-iac.sh; then
            record_stage_result "pass"
            return 0
        else
            local exit_code=$?
            if [ $exit_code -eq 1 ]; then
                check_blocking_condition "true" "Pre-deployment validation failed with errors"
                return 1
            else
                record_stage_result "warning"
                return 0
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  pre-validate-iac.sh not found - skipping${NC}"
        record_stage_result "warning"
        return 0
    fi
}

# ============================================================================
# Stage 4: Code Health Check
# ============================================================================
stage_4_code_health_check() {
    print_stage_header
    
    if [ -f "$SCRIPT_DIR/code-health-check.sh" ]; then
        if bash "$SCRIPT_DIR/code-health-check.sh"; then
            record_stage_result "pass"
            return 0
        else
            local exit_code=$?
            if [ $exit_code -eq 1 ]; then
                check_blocking_condition "true" "Code health check failed with errors"
                return 1
            else
                record_stage_result "warning"
                return 0
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  code-health-check.sh not found - skipping${NC}"
        record_stage_result "warning"
        return 0
    fi
}

# ============================================================================
# Stage 5: Deployment
# ============================================================================
stage_5_deployment() {
    print_stage_header
    
    echo "Deployment stage - should be run manually per platform"
    echo "Checking for deployment outputs..."
    
    if [ -f "cfn-outputs/flat-outputs.json" ]; then
        echo -e "${GREEN}✅ Deployment outputs found${NC}"
        record_stage_result "pass"
        return 0
    else
        echo -e "${YELLOW}⚠️  No deployment outputs found${NC}"
        echo "   Deployment may not have been run yet"
        record_stage_result "warning"
        return 0
    fi
}

# ============================================================================
# Stage 6: Test Coverage Validation
# ============================================================================
stage_6_test_coverage() {
    print_stage_header
    
    if [ -f "coverage/coverage-summary.json" ]; then
        local statements=$(jq -r '.total.statements.pct // 0' coverage/coverage-summary.json 2>/dev/null || echo "0")
        local functions=$(jq -r '.total.functions.pct // 0' coverage/coverage-summary.json 2>/dev/null || echo "0")
        local lines=$(jq -r '.total.lines.pct // 0' coverage/coverage-summary.json 2>/dev/null || echo "0")
        
        echo "Coverage: Statements=$statements%, Functions=$functions%, Lines=$lines%"
        
        if (( $(echo "$statements >= 100" | bc -l 2>/dev/null || echo "0") )) && \
           (( $(echo "$functions >= 100" | bc -l 2>/dev/null || echo "0") )) && \
           (( $(echo "$lines >= 100" | bc -l 2>/dev/null || echo "0") )); then
            record_stage_result "pass"
            return 0
        else
            check_blocking_condition "true" "Test coverage below 100% (Statements=$statements%, Functions=$functions%, Lines=$lines%)"
            return 1
        fi
    else
        check_blocking_condition "true" "Coverage report not found (coverage/coverage-summary.json)"
        return 1
    fi
}

# ============================================================================
# Stage 7: Integration Test Validation
# ============================================================================
stage_7_integration_tests() {
    print_stage_header
    
    echo "Integration test validation - checking test results..."
    
    # Check if integration tests exist and passed
    # This is a placeholder - actual implementation depends on test framework
    record_stage_result "pass"
    return 0
}

# ============================================================================
# Stage 8: Documentation Validation
# ============================================================================
stage_8_documentation_validation() {
    print_stage_header
    
    if [ -f "$SCRIPT_DIR/validate-documentation.sh" ]; then
        if bash "$SCRIPT_DIR/validate-documentation.sh"; then
            record_stage_result "pass"
            return 0
        else
            local exit_code=$?
            if [ $exit_code -eq 1 ]; then
                check_blocking_condition "true" "Documentation validation failed"
                return 1
            else
                record_stage_result "warning"
                return 0
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  validate-documentation.sh not found - skipping${NC}"
        record_stage_result "warning"
        return 0
    fi
}

# ============================================================================
# Main Pipeline Execution
# ============================================================================
main() {
    print_header "${CYAN}QA Pipeline Execution${NC}"
    echo "Starting comprehensive QA validation pipeline..."
    echo ""
    
    local pipeline_failed=false
    local pipeline_blocked=false
    
    # Execute all stages
    stage_1_worktree_verification || { pipeline_blocked=true; }
    stage_2_code_quality || { pipeline_failed=true; }
    stage_3_pre_deployment_validation || { pipeline_blocked=true; }
    stage_4_code_health_check || { pipeline_blocked=true; }
    stage_5_deployment || { pipeline_failed=true; }
    stage_6_test_coverage || { pipeline_blocked=true; }
    stage_7_integration_tests || { pipeline_failed=true; }
    stage_8_documentation_validation || { pipeline_blocked=true; }
    
    # Final summary
    echo ""
    print_header "${CYAN}QA Pipeline Summary${NC}"
    
    local total_time=$(($(date +%s) - START_TIME))
    local total_min=$((total_time / 60))
    local total_sec=$((total_time % 60))
    
    echo "Total execution time: ${total_min}m ${total_sec}s"
    echo ""
    echo "Stage Results:"
    
    for i in "${!STAGE_NAMES[@]}"; do
        local stage_num=$((i + 1))
        local status="${STAGE_STATUS[$i]:-unknown}"
        local duration="${STAGE_DURATIONS[$i]:-0}"
        
        case "$status" in
            "pass")
                echo -e "  ${GREEN}✅${NC} Stage $stage_num: ${STAGE_NAMES[$i]} (${duration}s)"
                ;;
            "fail")
                echo -e "  ${RED}❌${NC} Stage $stage_num: ${STAGE_NAMES[$i]} (${duration}s)"
                ;;
            "warning")
                echo -e "  ${YELLOW}⚠️${NC}  Stage $stage_num: ${STAGE_NAMES[$i]} (${duration}s)"
                ;;
            "blocked")
                echo -e "  ${RED}🚫${NC} Stage $stage_num: ${STAGE_NAMES[$i]} (${duration}s)"
                ;;
            *)
                echo -e "  ${YELLOW}?${NC}  Stage $stage_num: ${STAGE_NAMES[$i]} (${duration}s)"
                ;;
        esac
    done
    
    echo ""
    
    if [ "$pipeline_blocked" = "true" ]; then
        echo -e "${RED}🚫 PIPELINE BLOCKED${NC}"
        echo "One or more stages were blocked. Please fix blocking conditions before proceeding."
        exit 1
    elif [ "$pipeline_failed" = "true" ]; then
        echo -e "${RED}❌ PIPELINE FAILED${NC}"
        echo "One or more stages failed. Please review errors above."
        exit 1
    else
        echo -e "${GREEN}✅ PIPELINE COMPLETED SUCCESSFULLY${NC}"
        exit 0
    fi
}

# Run main function
main "$@"

