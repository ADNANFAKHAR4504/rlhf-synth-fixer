#!/bin/bash
# Code Health Check - Advanced pattern matching from lessons_learnt.md
# Scans for: empty arrays, GuardDuty, AWS Config, Lambda SDK issues, etc.
# For basic validation, see pre-validate-iac.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LESSONS_LEARNT="$PROJECT_ROOT/.claude/lessons_learnt.md"

ERROR_COUNT=0
WARNING_COUNT=0
ISSUES=()

# Standardized colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Prerequisite checks
check_prerequisites() {
    local missing_deps=()
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v grep &> /dev/null; then
        missing_deps+=("grep")
    fi
    
    # Check grep supports extended regex
    if ! echo "test" | grep -E "test" &> /dev/null; then
        echo -e "${RED}❌ grep does not support extended regex (-E)${NC}"
        exit 1
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required dependencies: ${missing_deps[*]}${NC}"
        exit 1
    fi
    
    # Check if we're in a worktree
    if [ ! -f "metadata.json" ]; then
        echo -e "${YELLOW}⚠️  Not in worktree directory (metadata.json not found)${NC}"
        echo "   This script should be run from worktree/synth-{task_id}/"
        exit 1
    fi
}

check_prerequisites

echo "🔍 Running Code Health Check (Advanced Pattern Matching)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Read platform and language
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")

echo "Platform: $PLATFORM"
echo "Language: $LANGUAGE"
echo ""

# ============================================================================
# Pattern 1: Empty Arrays in Critical Resources
# ============================================================================
echo "📋 Checking for empty arrays in critical resources..."

if [ -d "lib" ]; then
    # Check for empty array patterns in DB subnet groups, security groups, etc.
    case "$LANGUAGE" in
        ts|js)
            EMPTY_ARRAYS=$(grep -rniE "(subnetIds|subnet_ids|securityGroupIds|security_group_ids|availabilityZones|availability_zones)\s*:\s*\[\s*\]" lib/ --include="*.ts" --include="*.js" 2>/dev/null || true)
            ;;
        py)
            EMPTY_ARRAYS=$(grep -rniE "(subnet_ids|security_group_ids|availability_zones)\s*=\s*\[\s*\]" lib/ --include="*.py" 2>/dev/null || true)
            ;;
        *)
            EMPTY_ARRAYS=""
            ;;
    esac
    
    if [ -n "$EMPTY_ARRAYS" ]; then
        echo -e "${RED}❌ ERROR: Empty arrays found in critical resources${NC}"
        echo "$EMPTY_ARRAYS" | head -5
        ((ERROR_COUNT++))
        ISSUES+=("Empty arrays in critical resources (DB subnet groups, security groups)")
    else
        echo -e "${GREEN}✅ No empty arrays detected${NC}"
    fi
fi

# ============================================================================
# Pattern 2: Circular Dependencies
# ============================================================================
echo ""
echo "📋 Checking for potential circular dependencies..."

if [ -d "lib" ]; then
    # Look for patterns where resource A references B and B references A
    # This is a simplified check - full analysis would require AST parsing
    CIRCULAR_PATTERNS=$(grep -rniE "(dependsOn|depends_on|DependsOn)\s*:\s*\[.*\]" lib/ --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | wc -l || echo "0")
    
    if [ "$CIRCULAR_PATTERNS" -gt 5 ]; then
        echo -e "${YELLOW}⚠️  WARNING: Many dependency declarations found - review for circular dependencies${NC}"
        ((WARNING_COUNT++))
        ISSUES+=("Potential circular dependencies (manual review recommended)")
    else
        echo -e "${GREEN}✅ No obvious circular dependency patterns${NC}"
    fi
fi

# ============================================================================
# Pattern 3: GuardDuty Detector Creation
# ============================================================================
echo ""
echo "📋 Checking for GuardDuty detector creation..."

if [ -d "lib" ]; then
    GUARDDUTY=$(grep -rniE "(GuardDuty|guardduty|aws_guardduty_detector)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.hcl" --include="*.tf" 2>/dev/null || true)
    
    if [ -n "$GUARDDUTY" ]; then
        echo -e "${RED}❌ ERROR: GuardDuty detector creation detected${NC}"
        echo "   GuardDuty allows only ONE detector per AWS account/region"
        echo "   Remove GuardDuty from infrastructure code"
        echo "$GUARDDUTY" | head -3
        ((ERROR_COUNT++))
        ISSUES+=("GuardDuty detector creation (account-level resource, not stack-level)")
    else
        echo -e "${GREEN}✅ No GuardDuty detector creation${NC}"
    fi
fi

# ============================================================================
# Pattern 4: AWS Config IAM Policy Issues
# ============================================================================
echo ""
echo "📋 Checking for AWS Config IAM policy issues..."

if [ -d "lib" ]; then
    CONFIG_POLICY=$(grep -rniE "(ConfigRole|config.*role)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" 2>/dev/null | grep -iE "(service-role/ConfigRole|AWS_ConfigRole)" | grep -v "service-role/AWS_ConfigRole" || true)
    
    if [ -n "$CONFIG_POLICY" ]; then
        echo -e "${RED}❌ ERROR: Incorrect AWS Config IAM policy name detected${NC}"
        echo "   Correct policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        echo "$CONFIG_POLICY" | head -3
        ((ERROR_COUNT++))
        ISSUES+=("Incorrect AWS Config IAM policy name")
    else
        echo -e "${GREEN}✅ AWS Config IAM policy check passed${NC}"
    fi
fi

# ============================================================================
# Pattern 5: Lambda Reserved Concurrency Issues
# ============================================================================
echo ""
echo "📋 Checking for Lambda reserved concurrency issues..."

if [ -d "lib" ]; then
    HIGH_CONCURRENCY=$(grep -rniE "(reservedConcurrentExecutions|reserved_concurrent_executions)\s*:\s*[5-9][0-9]" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" 2>/dev/null || true)
    
    if [ -n "$HIGH_CONCURRENCY" ]; then
        echo -e "${YELLOW}⚠️  WARNING: High Lambda reserved concurrency detected${NC}"
        echo "   May cause account limit issues - consider removing or using low values (1-5)"
        echo "$HIGH_CONCURRENCY" | head -3
        ((WARNING_COUNT++))
        ISSUES+=("High Lambda reserved concurrency (may hit account limits)")
    else
        echo -e "${GREEN}✅ Lambda concurrency check passed${NC}"
    fi
fi

# ============================================================================
# Pattern 6: AWS SDK v2 in Node.js 18+
# ============================================================================
echo ""
echo "📋 Checking for AWS SDK v2 usage in Node.js 18+..."

if [ -d "lib" ]; then
    AWS_SDK_V2=$(grep -rniE "(require\(['\"]aws-sdk['\"]|from ['\"]aws-sdk['\"])" lib/ --include="*.js" --include="*.ts" 2>/dev/null || true)
    NODE_18=$(grep -rniE "runtime.*nodejs18|nodejs18" lib/ --include="*.ts" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" 2>/dev/null || true)
    
    if [ -n "$AWS_SDK_V2" ] && [ -n "$NODE_18" ]; then
        echo -e "${RED}❌ ERROR: AWS SDK v2 detected with Node.js 18+ runtime${NC}"
        echo "   AWS SDK v2 not available in Node.js 18.x+ - use AWS SDK v3 or extract from event"
        echo "$AWS_SDK_V2" | head -3
        ((ERROR_COUNT++))
        ISSUES+=("AWS SDK v2 with Node.js 18+ (not available)")
    else
        echo -e "${GREEN}✅ AWS SDK check passed${NC}"
    fi
fi

# ============================================================================
# Pattern 7: Expensive Resources (NAT Gateway, RDS Multi-AZ)
# ============================================================================
echo ""
echo "📋 Checking for expensive resource configurations..."

if [ -d "lib" ]; then
    NAT_GATEWAYS=$(grep -rniE "(NatGateway|aws_nat_gateway)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.hcl" --include="*.tf" 2>/dev/null | wc -l || echo "0")
    RDS_MULTIAZ=$(grep -rniE "(multiAz|multi_az|MultiAZ)\s*:\s*true" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" 2>/dev/null | wc -l || echo "0")
    
    if [ "$NAT_GATEWAYS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  WARNING: NAT Gateways detected (~\$32/month each)${NC}"
        ((WARNING_COUNT++))
        ISSUES+=("NAT Gateways detected (expensive - consider VPC Endpoints)")
    fi
    
    if [ "$RDS_MULTIAZ" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  WARNING: RDS Multi-AZ detected (slow deployment, expensive)${NC}"
        ((WARNING_COUNT++))
        ISSUES+=("RDS Multi-AZ detected (slow deployment, expensive)")
    fi
    
    if [ "$NAT_GATEWAYS" -eq 0 ] && [ "$RDS_MULTIAZ" -eq 0 ]; then
        echo -e "${GREEN}✅ No expensive resource configurations detected${NC}"
    fi
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Code Health Check Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"
echo ""

if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "Issues Found:"
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue"
    done
    echo ""
fi

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Code Health Check FAILED with $ERROR_COUNT error(s)${NC}"
    echo "   Please fix the errors above before proceeding"
    exit 1
elif [ $WARNING_COUNT -gt 3 ]; then
    echo -e "${YELLOW}⚠️  Code Health Check completed with $WARNING_COUNT warnings${NC}"
    echo "   Consider reviewing warnings, but proceeding"
    exit 0
else
    echo -e "${GREEN}✅ Code Health Check PASSED${NC}"
    exit 0
fi

