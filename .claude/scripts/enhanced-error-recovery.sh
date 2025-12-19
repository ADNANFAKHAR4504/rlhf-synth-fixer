#!/bin/bash
# Enhanced Error Recovery - Applies fixes based on error analysis
# Integrates with deployment-failure-analysis.sh to automatically fix recoverable errors

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ERROR_TYPE="${1:-}"
ERROR_MSG="${2:-}"
ATTEMPT_NUMBER="${3:-1}"
MAX_ATTEMPTS="${4:-5}"

# Standardized colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
if [ ! -f "metadata.json" ]; then
    echo -e "${RED}❌ Not in worktree directory (metadata.json not found)${NC}"
    exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")

echo "🔧 Enhanced Error Recovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Error Type: $ERROR_TYPE"
echo "Attempt: $ATTEMPT_NUMBER / $MAX_ATTEMPTS"
echo "Platform: $PLATFORM, Language: $LANGUAGE"
echo ""

# Determine if error is recoverable
is_recoverable() {
    case "$ERROR_TYPE" in
        "aws_quota"|"permission_error")
            return 1  # Not recoverable
            ;;
        "transient_error"|"timeout_error")
            return 0  # Can retry
            ;;
        *)
            return 0  # Can attempt fix
            ;;
    esac
}

# Apply fixes based on error type
apply_fix() {
    local fix_type="$1"
    
    case "$fix_type" in
        "missing_environment_suffix")
            echo -e "${YELLOW}⚠️  Fix: Adding environmentSuffix to resource names${NC}"
            echo "   This requires manual code changes - please review and update"
            return 1  # Requires manual intervention
            ;;
        
        "retain_policy")
            echo -e "${BLUE}🔧 Fix: Removing Retain policies...${NC}"
            if [ -d "lib" ]; then
                case "$LANGUAGE" in
                    ts|js)
                        # Remove RemovalPolicy.RETAIN
                        find lib -type f \( -name "*.ts" -o -name "*.js" \) -exec sed -i.bak 's/removalPolicy:\s*RemovalPolicy\.RETAIN/removalPolicy: RemovalPolicy.DESTROY/g' {} \;
                        find lib -type f \( -name "*.ts" -o -name "*.js" \) -exec sed -i.bak 's/RemovalPolicy\.RETAIN/RemovalPolicy.DESTROY/g' {} \;
                        ;;
                    py)
                        # Remove RemovalPolicy.RETAIN
                        find lib -type f -name "*.py" -exec sed -i.bak 's/removal_policy=RemovalPolicy\.RETAIN/removal_policy=RemovalPolicy.DESTROY/g' {} \;
                        find lib -type f -name "*.py" -exec sed -i.bak 's/RemovalPolicy\.RETAIN/RemovalPolicy.DESTROY/g' {} \;
                        ;;
                esac
                # Clean up backup files
                find lib -name "*.bak" -delete 2>/dev/null || true
                echo -e "${GREEN}✅ Removed Retain policies${NC}"
                return 0
            fi
            ;;
        
        "deletion_protection")
            echo -e "${BLUE}🔧 Fix: Disabling deletion protection...${NC}"
            if [ -d "lib" ]; then
                find lib -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.tf" -o -name "*.hcl" \) \
                    -exec sed -i.bak 's/deletionProtection:\s*true/deletionProtection: false/g' {} \;
                find lib -type f \( -name "*.py" \) \
                    -exec sed -i.bak 's/deletion_protection=True/deletion_protection=False/g' {} \;
                find lib -type f \( -name "*.tf" -o -name "*.hcl" \) \
                    -exec sed -i.bak 's/deletion_protection\s*=\s*true/deletion_protection = false/g' {} \;
                find lib -name "*.bak" -delete 2>/dev/null || true
                echo -e "${GREEN}✅ Disabled deletion protection${NC}"
                return 0
            fi
            ;;
        
        "guardduty_detector")
            echo -e "${BLUE}🔧 Fix: Removing GuardDuty detector creation...${NC}"
            echo "   GuardDuty is account-level - removing from infrastructure code"
            if [ -d "lib" ]; then
                # Comment out GuardDuty resources (safer than deletion)
                case "$LANGUAGE" in
                    ts|js)
                        find lib -type f \( -name "*.ts" -o -name "*.js" \) \
                            -exec sed -i.bak '/GuardDuty\|guardduty/s/^/\/\/ REMOVED: /' {} \;
                        ;;
                    py)
                        find lib -type f -name "*.py" \
                            -exec sed -i.bak '/GuardDuty\|guardduty/s/^/# REMOVED: /' {} \;
                        ;;
                esac
                find lib -name "*.bak" -delete 2>/dev/null || true
                echo -e "${GREEN}✅ Commented out GuardDuty detector${NC}"
                return 0
            fi
            ;;
        
        "lambda_concurrency")
            echo -e "${BLUE}🔧 Fix: Removing high Lambda reserved concurrency...${NC}"
            if [ -d "lib" ]; then
                case "$LANGUAGE" in
                    ts|js)
                        find lib -type f \( -name "*.ts" -o -name "*.js" \) \
                            -exec sed -i.bak 's/reservedConcurrentExecutions:\s*[5-9][0-9]*/\/\/ removed: reservedConcurrentExecutions/g' {} \;
                        ;;
                    py)
                        find lib -type f -name "*.py" \
                            -exec sed -i.bak 's/reserved_concurrent_executions\s*=\s*[5-9][0-9]*/# removed: reserved_concurrent_executions/g' {} \;
                        ;;
                esac
                find lib -name "*.bak" -delete 2>/dev/null || true
                echo -e "${GREEN}✅ Removed high Lambda concurrency${NC}"
                return 0
            fi
            ;;
        
        "aws_sdk_v2")
            echo -e "${YELLOW}⚠️  Fix: AWS SDK v2 issue requires manual code changes${NC}"
            echo "   Replace 'aws-sdk' with '@aws-sdk/client-*' or extract from event"
            return 1  # Requires manual intervention
            ;;
        
        "config_iam_policy")
            echo -e "${BLUE}🔧 Fix: Updating AWS Config IAM policy name...${NC}"
            if [ -d "lib" ]; then
                find lib -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) \
                    -exec sed -i.bak 's/service-role\/ConfigRole/service-role\/AWS_ConfigRole/g' {} \;
                find lib -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) \
                    -exec sed -i.bak 's/AWS_ConfigRole[^"]/service-role\/AWS_ConfigRole/g' {} \;
                find lib -name "*.bak" -delete 2>/dev/null || true
                echo -e "${GREEN}✅ Updated AWS Config IAM policy name${NC}"
                return 0
            fi
            ;;
        
        "transient_error"|"timeout_error")
            echo -e "${YELLOW}⚠️  Transient error detected - will retry${NC}"
            return 0  # Can retry
            ;;
        
        *)
            echo -e "${YELLOW}⚠️  Unknown error type: $fix_type${NC}"
            echo "   Manual review required"
            return 1
            ;;
    esac
}

# Main function
main() {
    if [ -z "$ERROR_TYPE" ]; then
        echo "Usage: $0 <error_type> <error_msg> [attempt_number] [max_attempts]"
        echo ""
        echo "Error types: missing_environment_suffix, retain_policy, deletion_protection,"
        echo "            guardduty_detector, lambda_concurrency, aws_sdk_v2, config_iam_policy,"
        echo "            transient_error, timeout_error, aws_quota, permission_error"
        exit 1
    fi
    
    if ! is_recoverable; then
        echo -e "${RED}❌ Error type '$ERROR_TYPE' is not recoverable${NC}"
        echo "   Requires manual intervention"
        exit 1
    fi
    
    if [ "$ATTEMPT_NUMBER" -ge "$MAX_ATTEMPTS" ]; then
        echo -e "${RED}❌ Max attempts ($MAX_ATTEMPTS) reached${NC}"
        exit 1
    fi
    
    if apply_fix "$ERROR_TYPE"; then
        echo ""
        echo -e "${GREEN}✅ Fix applied successfully${NC}"
        echo "   Ready to retry deployment"
        exit 0
    else
        echo ""
        echo -e "${YELLOW}⚠️  Fix requires manual intervention${NC}"
        exit 1
    fi
}

main "$@"
