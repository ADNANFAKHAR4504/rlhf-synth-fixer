#!/bin/bash
# Documentation Validation Script
# Validates MODEL_FAILURES.md and other documentation files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Standardized colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

ERROR_COUNT=0
WARNING_COUNT=0

echo "📋 Validating Documentation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in a worktree
if [ ! -f "metadata.json" ]; then
    echo -e "${YELLOW}⚠️  Not in worktree directory (metadata.json not found)${NC}"
    echo "   This script should be run from worktree/synth-{task_id}/"
    exit 1
fi

# Check for MODEL_FAILURES.md
if [ ! -f "lib/MODEL_FAILURES.md" ]; then
    echo -e "${RED}❌ ERROR: lib/MODEL_FAILURES.md not found${NC}"
    ((ERROR_COUNT++))
else
    echo -e "${GREEN}✅ MODEL_FAILURES.md exists${NC}"
    
    # Validate MODEL_FAILURES.md structure
    if ! grep -q "## " lib/MODEL_FAILURES.md; then
        echo -e "${YELLOW}⚠️  WARNING: MODEL_FAILURES.md appears to be missing sections${NC}"
        ((WARNING_COUNT++))
    fi
    
    # Check for required sections
    if ! grep -qiE "(issue|problem|root cause|solution|fix)" lib/MODEL_FAILURES.md; then
        echo -e "${YELLOW}⚠️  WARNING: MODEL_FAILURES.md may be missing required content${NC}"
        ((WARNING_COUNT++))
    fi
    
    # Check file size (should not be empty)
    if [ ! -s "lib/MODEL_FAILURES.md" ]; then
        echo -e "${RED}❌ ERROR: MODEL_FAILURES.md is empty${NC}"
        ((ERROR_COUNT++))
    fi
fi

# Check for IDEAL_RESPONSE.md (optional but recommended)
if [ ! -f "lib/IDEAL_RESPONSE.md" ]; then
    echo -e "${YELLOW}⚠️  WARNING: lib/IDEAL_RESPONSE.md not found (optional but recommended)${NC}"
    ((WARNING_COUNT++))
else
    echo -e "${GREEN}✅ IDEAL_RESPONSE.md exists${NC}"
    
    # Check file size
    if [ ! -s "lib/IDEAL_RESPONSE.md" ]; then
        echo -e "${YELLOW}⚠️  WARNING: IDEAL_RESPONSE.md is empty${NC}"
        ((WARNING_COUNT++))
    fi
fi

# Validate markdown syntax (basic check)
if command -v markdownlint &> /dev/null; then
    if [ -f "lib/MODEL_FAILURES.md" ]; then
        if ! markdownlint lib/MODEL_FAILURES.md 2>/dev/null; then
            echo -e "${YELLOW}⚠️  WARNING: MODEL_FAILURES.md has markdown linting issues${NC}"
            ((WARNING_COUNT++))
        fi
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Documentation Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Documentation validation FAILED with $ERROR_COUNT error(s)${NC}"
    exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Documentation validation completed with $WARNING_COUNT warnings${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Documentation validation PASSED${NC}"
    exit 0
fi
