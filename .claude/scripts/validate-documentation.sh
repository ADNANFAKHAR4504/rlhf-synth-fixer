#!/bin/bash
# Documentation Quality Validation
# Validates MODEL_FAILURES.md and IDEAL_RESPONSE.md structure and completeness

set -euo pipefail

ERROR_COUNT=0
WARNING_COUNT=0

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "📋 Validating Documentation Quality..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in a worktree
if [ ! -f "metadata.json" ]; then
    echo "⚠️  Not in worktree directory (metadata.json not found)"
    exit 1
fi

# ============================================================================
# Validate MODEL_FAILURES.md
# ============================================================================
echo ""
echo "📋 Validating MODEL_FAILURES.md..."

MODEL_FAILURES="lib/MODEL_FAILURES.md"

if [ ! -f "$MODEL_FAILURES" ]; then
    echo -e "${RED}❌ ERROR: MODEL_FAILURES.md not found in lib/${NC}"
    ((ERROR_COUNT++))
else
    echo -e "${GREEN}✅ MODEL_FAILURES.md exists${NC}"
    
    # Check for required sections
    REQUIRED_SECTIONS=("Critical Failures" "Summary")
    
    for section in "${REQUIRED_SECTIONS[@]}"; do
        if grep -qiE "^#+\s*${section}" "$MODEL_FAILURES"; then
            echo -e "${GREEN}  ✅ Section found: $section${NC}"
        else
            echo -e "${RED}  ❌ Missing required section: $section${NC}"
            ((ERROR_COUNT++))
        fi
    done
    
    # Check for severity levels
    SEVERITY_LEVELS=$(grep -iE "Impact Level|Severity.*Critical|Severity.*High|Severity.*Medium|Severity.*Low" "$MODEL_FAILURES" | wc -l || echo "0")
    
    if [ "$SEVERITY_LEVELS" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠️  WARNING: No severity levels found${NC}"
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}  ✅ Severity levels found: $SEVERITY_LEVELS${NC}"
    fi
    
    # Check for root cause analysis
    ROOT_CAUSE=$(grep -iE "Root Cause|root cause|Why.*model.*made" "$MODEL_FAILURES" | wc -l || echo "0")
    
    if [ "$ROOT_CAUSE" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠️  WARNING: No root cause analysis found${NC}"
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}  ✅ Root cause analysis found: $ROOT_CAUSE instances${NC}"
    fi
    
    # Check for failure count in summary
    FAILURE_COUNT=$(grep -iE "Total failures|failures.*Critical|failures.*High" "$MODEL_FAILURES" | wc -l || echo "0")
    
    if [ "$FAILURE_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠️  WARNING: No failure count in summary${NC}"
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}  ✅ Failure count in summary found${NC}"
    fi
    
    # Check for training value justification
    TRAINING_VALUE=$(grep -iE "Training value|training_quality|Training Quality" "$MODEL_FAILURES" | wc -l || echo "0")
    
    if [ "$TRAINING_VALUE" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠️  WARNING: No training value justification found${NC}"
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}  ✅ Training value justification found${NC}"
    fi
    
    # Validate severity categorization
    CRITICAL_COUNT=$(grep -iE "Critical|Critical Failures" "$MODEL_FAILURES" | grep -v "^#" | wc -l || echo "0")
    HIGH_COUNT=$(grep -iE "Impact Level.*High|Severity.*High" "$MODEL_FAILURES" | wc -l || echo "0")
    MEDIUM_COUNT=$(grep -iE "Impact Level.*Medium|Severity.*Medium" "$MODEL_FAILURES" | wc -l || echo "0")
    LOW_COUNT=$(grep -iE "Impact Level.*Low|Severity.*Low" "$MODEL_FAILURES" | wc -l || echo "0")
    
    echo "  Severity breakdown:"
    echo "    Critical: $CRITICAL_COUNT"
    echo "    High: $HIGH_COUNT"
    echo "    Medium: $MEDIUM_COUNT"
    echo "    Low: $LOW_COUNT"
    
    # Check for proper structure (each failure should have sections)
    FAILURE_HEADERS=$(grep -E "^###\s+[0-9]+\." "$MODEL_FAILURES" | wc -l || echo "0")
    
    if [ "$FAILURE_HEADERS" -gt 0 ]; then
        echo -e "${GREEN}  ✅ Failures properly numbered: $FAILURE_HEADERS${NC}"
        
        # Check each failure has required subsections
        MISSING_SUBSECTIONS=0
        while IFS= read -r header; do
            # Get line number of header
            LINE_NUM=$(grep -n "$header" "$MODEL_FAILURES" | cut -d: -f1)
            # Get next header or end of file
            NEXT_LINE=$(tail -n +$((LINE_NUM + 1)) "$MODEL_FAILURES" | grep -n "^###\|^##" | head -1 | cut -d: -f1)
            if [ -z "$NEXT_LINE" ]; then
                NEXT_LINE=$(wc -l < "$MODEL_FAILURES")
            else
                NEXT_LINE=$((LINE_NUM + NEXT_LINE - 1))
            fi
            
            # Check for required subsections in this failure block
            SECTION_BLOCK=$(sed -n "${LINE_NUM},${NEXT_LINE}p" "$MODEL_FAILURES")
            
            if ! echo "$SECTION_BLOCK" | grep -qiE "MODEL_RESPONSE Issue|IDEAL_RESPONSE Fix|Root Cause"; then
                ((MISSING_SUBSECTIONS++))
            fi
        done <<< "$(grep -E "^###\s+[0-9]+\." "$MODEL_FAILURES")"
        
        if [ $MISSING_SUBSECTIONS -gt 0 ]; then
            echo -e "${YELLOW}  ⚠️  WARNING: $MISSING_SUBSECTIONS failures missing required subsections${NC}"
            ((WARNING_COUNT++))
        fi
    fi
fi

# ============================================================================
# Validate IDEAL_RESPONSE.md
# ============================================================================
echo ""
echo "📋 Validating IDEAL_RESPONSE.md..."

IDEAL_RESPONSE="lib/IDEAL_RESPONSE.md"

if [ ! -f "$IDEAL_RESPONSE" ]; then
    echo -e "${RED}❌ ERROR: IDEAL_RESPONSE.md not found in lib/${NC}"
    ((ERROR_COUNT++))
else
    echo -e "${GREEN}✅ IDEAL_RESPONSE.md exists${NC}"
    
    # Check file is not empty
    FILE_SIZE=$(wc -c < "$IDEAL_RESPONSE" || echo "0")
    
    if [ "$FILE_SIZE" -lt 1000 ]; then
        echo -e "${YELLOW}  ⚠️  WARNING: IDEAL_RESPONSE.md seems too short (< 1KB)${NC}"
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}  ✅ IDEAL_RESPONSE.md has sufficient content${NC}"
    fi
    
    # Check for code blocks (should contain actual code)
    CODE_BLOCKS=$(grep -c "^```" "$IDEAL_RESPONSE" || echo "0")
    
    if [ "$CODE_BLOCKS" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠️  WARNING: No code blocks found in IDEAL_RESPONSE.md${NC}"
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}  ✅ Code blocks found: $((CODE_BLOCKS / 2))${NC}"
    fi
    
    # If MODEL_RESPONSE exists, compare structure
    MODEL_RESPONSE="lib/MODEL_RESPONSE.md"
    if [ -f "$MODEL_RESPONSE" ]; then
        # Check if IDEAL_RESPONSE addresses issues from MODEL_FAILURES
        if [ -f "$MODEL_FAILURES" ]; then
            # Extract failure descriptions from MODEL_FAILURES
            FAILURE_ISSUES=$(grep -iE "MODEL_RESPONSE Issue|Issue:" "$MODEL_FAILURES" | head -5)
            
            if [ -n "$FAILURE_ISSUES" ]; then
                # Check if IDEAL_RESPONSE mentions fixes
                FIXES_MENTIONED=0
                while IFS= read -r issue; do
                    # Extract key terms from issue
                    KEY_TERMS=$(echo "$issue" | grep -oE "\b[A-Z][a-z]+[A-Z][a-z]+\b|\b[A-Z]{2,}\b" | head -3)
                    for term in $KEY_TERMS; do
                        if grep -qi "$term" "$IDEAL_RESPONSE"; then
                            ((FIXES_MENTIONED++))
                            break
                        fi
                    done
                done <<< "$FAILURE_ISSUES"
                
                if [ $FIXES_MENTIONED -gt 0 ]; then
                    echo -e "${GREEN}  ✅ IDEAL_RESPONSE appears to address failures from MODEL_FAILURES${NC}"
                else
                    echo -e "${YELLOW}  ⚠️  WARNING: IDEAL_RESPONSE may not address all failures from MODEL_FAILURES${NC}"
                    ((WARNING_COUNT++))
                fi
            fi
        fi
    fi
fi

# ============================================================================
# Check documentation matches deployed code
# ============================================================================
echo ""
echo "📋 Checking documentation matches deployed code..."

if [ -f "cfn-outputs/flat-outputs.json" ]; then
    echo -e "${GREEN}  ✅ Deployment outputs found${NC}"
    
    # Check if IDEAL_RESPONSE mentions outputs
    if [ -f "$IDEAL_RESPONSE" ]; then
        OUTPUT_KEYS=$(jq -r 'keys[]' cfn-outputs/flat-outputs.json 2>/dev/null | head -5)
        
        MATCHES=0
        for key in $OUTPUT_KEYS; do
            if grep -qi "$key" "$IDEAL_RESPONSE"; then
                ((MATCHES++))
            fi
        done
        
        if [ $MATCHES -gt 0 ]; then
            echo -e "${GREEN}  ✅ IDEAL_RESPONSE references deployment outputs${NC}"
        else
            echo -e "${YELLOW}  ⚠️  WARNING: IDEAL_RESPONSE may not match deployed outputs${NC}"
            ((WARNING_COUNT++))
        fi
    fi
else
    echo -e "${YELLOW}  ⚠️  WARNING: No deployment outputs found - cannot verify match${NC}"
    ((WARNING_COUNT++))
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Documentation Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Documentation Validation FAILED with $ERROR_COUNT error(s)${NC}"
    exit 1
elif [ $WARNING_COUNT -gt 3 ]; then
    echo -e "${YELLOW}⚠️  Documentation Validation completed with $WARNING_COUNT warnings${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Documentation Validation PASSED${NC}"
    exit 0
fi

