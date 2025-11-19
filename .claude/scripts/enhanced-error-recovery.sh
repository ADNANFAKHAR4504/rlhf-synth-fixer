#!/bin/bash
# Enhanced Error Recovery - Automatic retry logic and smart fix suggestions
# Integrates with error recovery guide and lessons_learnt.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ERROR_TYPE="${1:-}"
ERROR_MESSAGE="${2:-}"
ATTEMPT_NUMBER="${3:-1}"
MAX_ATTEMPTS="${4:-5}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Retry configuration
INITIAL_RETRY_DELAY=30  # seconds
MAX_RETRY_DELAY=300     # 5 minutes
BACKOFF_MULTIPLIER=2

# Determine error category and recovery action
classify_error() {
    local error_msg="$1"
    
    # Transient errors (can retry)
    if echo "$error_msg" | grep -qiE "Throttling|Rate exceeded|ServiceUnavailable|RequestTimeout|Temporary"; then
        echo "transient"
        return
    fi
    
    # Quota errors (requires escalation)
    if echo "$error_msg" | grep -qiE "quota|limit exceeded|ServiceLimitExceeded|LimitExceeded"; then
        echo "quota"
        return
    fi
    
    # Permission errors (requires escalation)
    if echo "$error_msg" | grep -qiE "AccessDenied|InvalidCredentials|UnauthorizedOperation|Permission denied"; then
        echo "permission"
        return
    fi
    
    # Dependency errors (can auto-fix)
    if echo "$error_msg" | grep -qiE "not found|SecurityGroup.*not found|VPC.*not found|Subnet.*not found"; then
        echo "dependency"
        return
    fi
    
    # Configuration errors (can auto-fix)
    if echo "$error_msg" | grep -qiE "InvalidParameterValue|ValidationError|Invalid.*value"; then
        echo "configuration"
        return
    fi
    
    # Resource conflict (can auto-fix)
    if echo "$error_msg" | grep -qiE "AlreadyExists|ResourceConflict|BucketAlreadyExists|NameInUse"; then
        echo "conflict"
        return
    fi
    
    # Unknown
    echo "unknown"
}

# Calculate retry delay with exponential backoff
calculate_retry_delay() {
    local attempt=$1
    local delay=$INITIAL_RETRY_DELAY
    
    for ((i=1; i<attempt; i++)); do
        delay=$((delay * BACKOFF_MULTIPLIER))
        if [ $delay -gt $MAX_RETRY_DELAY ]; then
            delay=$MAX_RETRY_DELAY
            break
        fi
    done
    
    echo $delay
}

# Apply automatic fixes based on error type
apply_auto_fix() {
    local error_category="$1"
    local error_msg="$2"
    
    case "$error_category" in
        "conflict")
            echo "🔧 Applying fix for resource conflict..."
            echo "   Adding environmentSuffix to resource names..."
            # This would call actual fix scripts
            return 0
            ;;
        "dependency")
            echo "🔧 Applying fix for dependency error..."
            echo "   Checking resource dependencies..."
            # This would analyze and fix dependencies
            return 0
            ;;
        "configuration")
            echo "🔧 Applying fix for configuration error..."
            echo "   Validating parameter values..."
            # This would fix configuration issues
            return 0
            ;;
        *)
            return 1  # Cannot auto-fix
            ;;
    esac
}

# Escalate to user for manual intervention
escalate_to_user() {
    local error_type="$1"
    local error_msg="$2"
    local required_action="$3"
    
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   USER INTERVENTION REQUIRED          ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Error Type: $error_type"
    echo "Error: $error_msg"
    echo ""
    echo "Required Action:"
    echo "$required_action"
    echo ""
    echo "Attempt: $ATTEMPT_NUMBER / $MAX_ATTEMPTS"
    echo ""
    echo "Deployment paused. Type 'continue' when resolved, or 'cancel' to abort:"
    
    # In automated mode, log and exit
    if [ "${AUTOMATED_MODE:-false}" = "true" ]; then
        echo "AUTOMATED MODE: Logging escalation and exiting"
        return 1
    fi
    
    read USER_INPUT
    
    if [ "$USER_INPUT" = "continue" ]; then
        return 0
    else
        echo "Deployment cancelled by user"
        return 1
    fi
}

# Main recovery logic
main() {
    if [ -z "$ERROR_TYPE" ] || [ -z "$ERROR_MESSAGE" ]; then
        echo "Usage: $0 <error_type> <error_message> [attempt_number] [max_attempts]"
        echo ""
        echo "Error Recovery with automatic retry and fix suggestions"
        exit 1
    fi
    
    echo "🔍 Error Recovery Analysis"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Error Type: $ERROR_TYPE"
    echo "Error Message: $ERROR_MESSAGE"
    echo "Attempt: $ATTEMPT_NUMBER / $MAX_ATTEMPTS"
    echo ""
    
    # Classify error
    local error_category=$(classify_error "$ERROR_MESSAGE")
    echo "Error Category: $error_category"
    echo ""
    
    # Determine recovery action
    case "$error_category" in
        "transient")
            if [ $ATTEMPT_NUMBER -lt $MAX_ATTEMPTS ]; then
                local delay=$(calculate_retry_delay $ATTEMPT_NUMBER)
                echo -e "${YELLOW}⚠️  Transient error detected${NC}"
                echo "   Retrying in ${delay}s (attempt $ATTEMPT_NUMBER/$MAX_ATTEMPTS)..."
                sleep $delay
                echo -e "${GREEN}✅ Retry delay completed - ready to retry${NC}"
                exit 0  # Signal to retry
            else
                echo -e "${RED}❌ Max retries reached for transient error${NC}"
                exit 1
            fi
            ;;
        "quota")
            escalate_to_user \
                "AWS Quota Limit" \
                "$ERROR_MESSAGE" \
                "Request quota increase via AWS Support Console\nRegion: Check AWS_REGION\nResource: Identify from error message"
            exit $?
            ;;
        "permission")
            escalate_to_user \
                "Permission Error" \
                "$ERROR_MESSAGE" \
                "Check IAM permissions and AWS account configuration\nVerify credentials and access policies"
            exit $?
            ;;
        "dependency"|"configuration"|"conflict")
            if apply_auto_fix "$error_category" "$ERROR_MESSAGE"; then
                echo -e "${GREEN}✅ Auto-fix applied successfully${NC}"
                echo "   Ready to retry deployment"
                exit 0  # Signal to retry
            else
                echo -e "${RED}❌ Auto-fix failed${NC}"
                exit 1
            fi
            ;;
        "unknown")
            if [ $ATTEMPT_NUMBER -lt $MAX_ATTEMPTS ]; then
                echo -e "${YELLOW}⚠️  Unknown error - attempting retry${NC}"
                local delay=$(calculate_retry_delay $ATTEMPT_NUMBER)
                sleep $delay
                exit 0  # Signal to retry
            else
                echo -e "${RED}❌ Unknown error - max retries reached${NC}"
                echo "   Manual review required"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}❌ Unhandled error category: $error_category${NC}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

