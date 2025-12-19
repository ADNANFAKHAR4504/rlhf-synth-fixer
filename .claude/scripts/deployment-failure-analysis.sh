#!/bin/bash
# Deployment Failure Analysis - Pattern matching and fix suggestions
# Integrates with lessons_learnt.md to suggest fixes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LESSONS_LEARNT="$PROJECT_ROOT/.claude/lessons_learnt.md"

DEPLOYMENT_LOG="${1:-}"
ATTEMPT_NUMBER="${2:-1}"
MAX_ATTEMPTS="${3:-5}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Error pattern database from lessons_learnt.md
declare -A ERROR_PATTERNS=(
    ["BucketAlreadyExists|ResourceConflict|AlreadyExistsException"]="missing_environment_suffix"
    ["Policy.*does not exist|InvalidPolicy|PolicyNotFound.*ConfigRole"]="config_iam_policy"
    ["Cannot find module|ImportError|ModuleNotFound"]="missing_dependency"
    ["quota|limit exceeded|ServiceLimitExceeded|LimitExceeded"]="aws_quota"
    ["RemovalPolicy.*RETAIN|DeletionPolicy.*Retain"]="retain_policy"
    ["GuardDuty.*detector.*exists|already exists for the current account"]="guardduty_detector"
    ["SYNTHETICS_NODEJS_PUPPETEER_[0-5]"]="deprecated_synthetics"
    ["aws-sdk.*not found|require.*aws-sdk|Cannot find module.*aws-sdk"]="aws_sdk_v2"
    ["deletionProtection.*true|deletion_protection.*True"]="deletion_protection"
    ["ReservedConcurrentExecutions.*decreases|UnreservedConcurrentExecution"]="lambda_concurrency"
    ["InvalidDBClusterStateFault|Source cluster.*not valid for physical replication"]="aurora_global_timing"
    ["InvalidParameterValue|ValidationError"]="configuration_error"
    ["Throttling|Rate exceeded|ServiceUnavailable"]="transient_error"
    ["AccessDenied|InvalidCredentials|UnauthorizedOperation"]="permission_error"
    ["SecurityGroup.*not found|VPC.*not found|Subnet.*not found"]="dependency_error"
    ["Timeout|RequestTimeout"]="timeout_error"
)

# Fix suggestions from lessons_learnt.md
declare -A FIX_SUGGESTIONS=(
    ["missing_environment_suffix"]="Add environmentSuffix to ALL resource names. Pattern: resourceName-\${environmentSuffix}"
    ["config_iam_policy"]="Use correct AWS Config IAM policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
    ["missing_dependency"]="Install missing dependency or fix import statement"
    ["aws_quota"]="AWS quota limit exceeded - requires manual intervention via AWS Support Console"
    ["retain_policy"]="Remove RemovalPolicy.RETAIN or DeletionPolicy Retain - resources must be destroyable"
    ["guardduty_detector"]="Remove GuardDuty detector creation - it's account-level, not stack-level"
    ["deprecated_synthetics"]="Update CloudWatch Synthetics runtime to SYNTHETICS_NODEJS_PUPPETEER_6 or later"
    ["aws_sdk_v2"]="For Node.js 18+, use AWS SDK v3 (@aws-sdk/client-*) or extract data from event object"
    ["deletion_protection"]="Set deletion_protection=false or skip_final_snapshot=true for destroyability"
    ["lambda_concurrency"]="Remove reservedConcurrentExecutions or set to low value (1-5)"
    ["aurora_global_timing"]="Add explicit wait for primary cluster to reach 'available' state before creating secondary"
    ["configuration_error"]="Review parameter values - check AWS documentation for valid values"
    ["transient_error"]="Retry with exponential backoff - this is a transient AWS service issue"
    ["permission_error"]="Check IAM permissions - may require manual AWS account configuration"
    ["dependency_error"]="Fix resource dependencies - ensure referenced resources are created first"
    ["timeout_error"]="Increase timeout values or check for slow resource provisioning (RDS Multi-AZ)"
)

# Extract error from deployment log
extract_error() {
    local log_file="$1"
    
    if [ ! -f "$log_file" ]; then
        echo "Error: Deployment log file not found: $log_file" >&2
        return 1
    fi
    
    # Extract error messages (case-insensitive)
    grep -iE "error|failed|failure|exception" "$log_file" | \
        grep -v "grep\|^--$" | \
        head -20
}

# Match error to pattern
match_error_pattern() {
    local error_text="$1"
    local matched_pattern=""
    local fix_type=""
    
    for pattern in "${!ERROR_PATTERNS[@]}"; do
        if echo "$error_text" | grep -qiE "$pattern"; then
            matched_pattern="$pattern"
            fix_type="${ERROR_PATTERNS[$pattern]}"
            break
        fi
    done
    
    echo "$fix_type"
}

# Get fix suggestion
get_fix_suggestion() {
    local fix_type="$1"
    
    if [ -z "$fix_type" ] || [ "$fix_type" == "unknown" ]; then
        echo "Manual review required - error pattern not recognized"
        return
    fi
    
    echo "${FIX_SUGGESTIONS[$fix_type]:-Manual review required}"
}

# Determine if error is recoverable
is_recoverable() {
    local fix_type="$1"
    
    case "$fix_type" in
        "aws_quota"|"permission_error")
            echo "no"  # Requires manual intervention
            ;;
        "transient_error"|"timeout_error")
            echo "retry"  # Can retry
            ;;
        *)
            echo "yes"  # Can auto-fix
            ;;
    esac
}

# Generate analysis report
generate_report() {
    local errors="$1"
    local attempt="$2"
    local max_attempts="$3"
    
    local report_file="/tmp/deployment-failure-analysis-${attempt}.json"
    local fix_types=()
    local recoverable_count=0
    local retry_count=0
    local manual_count=0
    
    echo "{" > "$report_file"
    echo "  \"attempt_number\": $attempt," >> "$report_file"
    echo "  \"max_attempts\": $max_attempts," >> "$report_file"
    echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$report_file"
    echo "  \"errors\": [" >> "$report_file"
    
    local first=true
    while IFS= read -r error_line; do
        if [ -z "$error_line" ]; then
            continue
        fi
        
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        local fix_type=$(match_error_pattern "$error_line")
        local suggestion=$(get_fix_suggestion "$fix_type")
        local recoverable=$(is_recoverable "$fix_type")
        
        if [ "$recoverable" == "yes" ]; then
            ((recoverable_count++))
        elif [ "$recoverable" == "retry" ]; then
            ((retry_count++))
        else
            ((manual_count++))
        fi
        
        fix_types+=("$fix_type")
        
        echo "    {" >> "$report_file"
        echo "      \"error\": $(echo "$error_line" | jq -Rs .)," >> "$report_file"
        echo "      \"fix_type\": \"$fix_type\"," >> "$report_file"
        echo "      \"suggestion\": $(echo "$suggestion" | jq -Rs .)," >> "$report_file"
        echo "      \"recoverable\": \"$recoverable\"" >> "$report_file"
        echo "    }" >> "$report_file"
    done <<< "$errors"
    
    echo "  ]," >> "$report_file"
    echo "  \"summary\": {" >> "$report_file"
    echo "    \"total_errors\": $(echo "$errors" | wc -l | tr -d ' ')," >> "$report_file"
    echo "    \"auto_fixable\": $recoverable_count," >> "$report_file"
    echo "    \"retryable\": $retry_count," >> "$report_file"
    echo "    \"manual_intervention\": $manual_count," >> "$report_file"
    echo "    \"unique_fix_types\": $(printf '%s\n' "${fix_types[@]}" | sort -u | jq -R . | jq -s .)" >> "$report_file"
    echo "  }," >> "$report_file"
    echo "  \"recommendation\": {" >> "$report_file"
    
    if [ $manual_count -gt 0 ]; then
        echo "    \"action\": \"escalate\"," >> "$report_file"
        echo "    \"reason\": \"Requires manual intervention (AWS quota or permissions)\"" >> "$report_file"
    elif [ $retry_count -gt 0 ] && [ $attempt -lt $max_attempts ]; then
        echo "    \"action\": \"retry\"," >> "$report_file"
        echo "    \"reason\": \"Transient error - retry with exponential backoff\"" >> "$report_file"
    elif [ $recoverable_count -gt 0 ] && [ $attempt -lt $max_attempts ]; then
        echo "    \"action\": \"fix_and_retry\"," >> "$report_file"
        echo "    \"reason\": \"Auto-fixable errors detected - apply fixes and retry\"" >> "$report_file"
    else
        echo "    \"action\": \"block\"," >> "$report_file"
        echo "    \"reason\": \"Max attempts reached or unrecoverable errors\"" >> "$report_file"
    fi
    
    echo "  }" >> "$report_file"
    echo "}" >> "$report_file"
    
    echo "$report_file"
}

# Main function
main() {
    if [ -z "$DEPLOYMENT_LOG" ]; then
        echo "Usage: $0 <deployment_log_file> [attempt_number] [max_attempts]"
        echo ""
        echo "Analyzes deployment failures and suggests fixes based on lessons_learnt.md"
        exit 1
    fi
    
    echo "🔍 Analyzing Deployment Failure..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Attempt: $ATTEMPT_NUMBER / $MAX_ATTEMPTS"
    echo "Log file: $DEPLOYMENT_LOG"
    echo ""
    
    # Extract errors
    local errors=$(extract_error "$DEPLOYMENT_LOG")
    
    if [ -z "$errors" ]; then
        echo -e "${GREEN}✅ No errors found in deployment log${NC}"
        exit 0
    fi
    
    # Generate report
    local report_file=$(generate_report "$errors" "$ATTEMPT_NUMBER" "$MAX_ATTEMPTS")
    
    # Display summary
    echo "📊 Error Analysis Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local total_errors=$(jq -r '.summary.total_errors' "$report_file")
    local auto_fixable=$(jq -r '.summary.auto_fixable' "$report_file")
    local retryable=$(jq -r '.summary.retryable' "$report_file")
    local manual=$(jq -r '.summary.manual_intervention' "$report_file")
    local action=$(jq -r '.recommendation.action' "$report_file")
    local reason=$(jq -r '.recommendation.reason' "$report_file")
    
    echo "Total Errors: $total_errors"
    echo "  Auto-fixable: $auto_fixable"
    echo "  Retryable: $retryable"
    echo "  Manual intervention: $manual"
    echo ""
    echo "Recommendation: $action"
    echo "Reason: $reason"
    echo ""
    
    # Display top errors with suggestions
    echo "Top Errors and Fix Suggestions:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    jq -r '.errors[:5][] | "\(.fix_type):\n  Error: \(.error)\n  Fix: \(.suggestion)\n"' "$report_file"
    
    echo ""
    echo "Full report: $report_file"
    
    # Exit code based on recommendation
    case "$action" in
        "escalate"|"block")
            exit 1
            ;;
        "retry"|"fix_and_retry")
            exit 0  # Can proceed
            ;;
        *)
            exit 1
            ;;
    esac
}

main "$@"

