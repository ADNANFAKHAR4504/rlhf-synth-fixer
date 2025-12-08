#!/bin/bash
# Training Quality Auto-Enhancer
# Analyzes current training quality score and applies improvements
# Usage: enhance-training-quality.sh [target_score]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SCORE="${1:-8}"
METADATA_FILE="${2:-metadata.json}"

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

ENHANCEMENTS_APPLIED=0

# Get current training quality score
get_current_score() {
    if [ ! -f "$METADATA_FILE" ]; then
        echo "0"
        return
    fi
    
    jq -r '.training_quality // 0' "$METADATA_FILE" 2>/dev/null || echo "0"
}

# Get platform info
get_platform_info() {
    if [ -f "$METADATA_FILE" ]; then
        PLATFORM=$(jq -r '.platform // "unknown"' "$METADATA_FILE" 2>/dev/null || echo "unknown")
        LANGUAGE=$(jq -r '.language // "unknown"' "$METADATA_FILE" 2>/dev/null || echo "unknown")
    else
        PLATFORM="unknown"
        LANGUAGE="unknown"
    fi
    export PLATFORM LANGUAGE
}

# Check if MODEL_FAILURES.md exists and is comprehensive
enhance_model_failures() {
    local failures_file="lib/MODEL_FAILURES.md"
    
    log_info "Checking MODEL_FAILURES.md..."
    
    if [ ! -f "$failures_file" ]; then
        log_warning "MODEL_FAILURES.md not found, creating..."
        
        mkdir -p lib
        cat > "$failures_file" << 'EOF'
# Model Failures Analysis

## Summary

This document captures the failures, mistakes, and learning opportunities identified during the code review process.

**Total Issues Found**: [To be updated]
**Critical Issues**: [Count]
**Medium Issues**: [Count]
**Minor Issues**: [Count]

---

## Critical Failures (Severity: HIGH)

Issues that would cause deployment failures, security vulnerabilities, or data loss.

### 1. [Issue Title]

- **What went wrong**: [Description of the failure]
- **Expected behavior**: [What should have happened]
- **Actual behavior**: [What the model generated]
- **Root cause**: [Why this happened - model limitation, missing context, etc.]
- **Fix applied**: [How it was corrected]
- **Learning value**: HIGH - [What the model should learn from this]

### 2. [Add more critical issues...]

---

## Medium Severity Issues

Issues that would cause functional problems but not complete failures.

### 1. [Issue Title]

- **Description**: [Details of the issue]
- **Impact**: [What would happen if not fixed]
- **Fix applied**: [Solution implemented]
- **Learning value**: MEDIUM

---

## Minor Issues / Best Practice Improvements

Code quality, style, and best practice improvements.

### 1. [Issue Title]

- **Improvement made**: [Description]
- **Best practice**: [The AWS/IaC best practice being applied]
- **Learning value**: LOW

---

## Patterns for Training

### Pattern 1: [Pattern Name]

**Problem**: [Describe the problematic pattern]
**Solution**: [Correct approach]

```typescript
// Bad - what the model generated
[code example]

// Good - correct implementation
[code example]
```

**Training Signal**: [Clear instruction for the model]

### Pattern 2: [Add more patterns...]

---

## AWS Service-Specific Learnings

### [Service Name] (e.g., S3, Lambda, RDS)

- **Common mistake 1**: [Description]
- **Correct approach**: [How to do it right]

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total issues | [X] |
| Auto-fixed | [Y] |
| Manual fixes | [Z] |
| Learning patterns | [N] |

EOF
        
        log_success "Created MODEL_FAILURES.md template"
        ENHANCEMENTS_APPLIED=$((ENHANCEMENTS_APPLIED + 1))
        return
    fi
    
    # Check if existing file is comprehensive (has meaningful content)
    local line_count=$(wc -l < "$failures_file")
    local has_critical=$(grep -c "Critical\|Severity: HIGH\|## Critical" "$failures_file" 2>/dev/null || echo "0")
    local has_patterns=$(grep -c "Pattern\|## Pattern" "$failures_file" 2>/dev/null || echo "0")
    
    if [ "$line_count" -lt 50 ] || [ "$has_critical" -eq 0 ]; then
        log_warning "MODEL_FAILURES.md appears incomplete (${line_count} lines)"
        log_info "Consider adding:"
        echo "  - Critical failures with severity levels"
        echo "  - Root cause analysis for each failure"
        echo "  - Code examples showing bad vs good patterns"
        echo "  - AWS service-specific learnings"
    else
        log_success "MODEL_FAILURES.md looks comprehensive (${line_count} lines)"
    fi
}

# Check if IDEAL_RESPONSE.md exists and is comprehensive
enhance_ideal_response() {
    local ideal_file="lib/IDEAL_RESPONSE.md"
    
    log_info "Checking IDEAL_RESPONSE.md..."
    
    if [ ! -f "$ideal_file" ]; then
        log_warning "IDEAL_RESPONSE.md not found, creating..."
        
        # Find the main stack file
        local stack_file=""
        local stack_content=""
        
        if [ -f "lib/tap-stack.ts" ]; then
            stack_file="lib/tap-stack.ts"
            stack_content=$(cat "$stack_file")
        elif [ -f "lib/tap_stack.py" ]; then
            stack_file="lib/tap_stack.py"
            stack_content=$(cat "$stack_file")
        elif [ -f "lib/tap-stack.go" ]; then
            stack_file="lib/tap-stack.go"
            stack_content=$(cat "$stack_file")
        fi
        
        mkdir -p lib
        
        if [ -n "$stack_file" ]; then
            cat > "$ideal_file" << EOF
# Ideal Response

This document contains the corrected, production-ready infrastructure code that addresses all issues found in the model's initial response.

## Overview

**Platform**: ${PLATFORM}
**Language**: ${LANGUAGE}
**Stack File**: ${stack_file}

## Key Corrections Applied

1. **[Correction 1]**: [Brief description]
2. **[Correction 2]**: [Brief description]
3. **[Add more corrections...]**

---

## Complete Infrastructure Code

\`\`\`${LANGUAGE}
${stack_content}
\`\`\`

---

## Implementation Details

### Security

- [ ] Encryption at rest configured (KMS/SSE)
- [ ] Encryption in transit (TLS/HTTPS)
- [ ] IAM least privilege policies
- [ ] Security groups properly configured
- [ ] No hardcoded secrets

### Best Practices

- [ ] Resource names include environmentSuffix
- [ ] Destroyable resources (no RETAIN policies)
- [ ] Proper tagging strategy
- [ ] CloudWatch logging enabled
- [ ] Error handling implemented

### AWS Well-Architected

- **Operational Excellence**: [Details]
- **Security**: [Details]
- **Reliability**: [Details]
- **Performance Efficiency**: [Details]
- **Cost Optimization**: [Details]

---

## Testing Verification

- [ ] Unit tests pass with 100% coverage
- [ ] Integration tests pass
- [ ] Deployment successful
- [ ] Resources accessible and functional

EOF
            
            log_success "Created IDEAL_RESPONSE.md with stack code"
            ENHANCEMENTS_APPLIED=$((ENHANCEMENTS_APPLIED + 1))
        else
            # Create basic template without code
            cat > "$ideal_file" << 'EOF'
# Ideal Response

This document should contain the corrected, production-ready infrastructure code.

## Overview

**Platform**: [Platform from metadata.json]
**Language**: [Language from metadata.json]

## Key Corrections Applied

1. [List corrections made to the model's response]
2. [Each correction should reference MODEL_FAILURES.md]

---

## Complete Infrastructure Code

```
[Include the complete, corrected infrastructure code here]
```

---

## Implementation Notes

[Add notes about implementation decisions and best practices applied]

EOF
            
            log_success "Created IDEAL_RESPONSE.md template"
            ENHANCEMENTS_APPLIED=$((ENHANCEMENTS_APPLIED + 1))
        fi
        return
    fi
    
    # Check if existing file has actual code
    local line_count=$(wc -l < "$ideal_file")
    local has_code=$(grep -c '```' "$ideal_file" 2>/dev/null || echo "0")
    
    if [ "$line_count" -lt 30 ] || [ "$has_code" -lt 2 ]; then
        log_warning "IDEAL_RESPONSE.md may be incomplete (${line_count} lines, ${has_code} code blocks)"
        log_info "Consider adding:"
        echo "  - Complete corrected infrastructure code"
        echo "  - Implementation details and best practices"
        echo "  - Security considerations"
    else
        log_success "IDEAL_RESPONSE.md looks comprehensive (${line_count} lines)"
    fi
}

# Check stack code for security best practices
check_security_practices() {
    log_info "Checking security best practices in stack code..."
    
    local stack_file=""
    if [ -f "lib/tap-stack.ts" ]; then
        stack_file="lib/tap-stack.ts"
    elif [ -f "lib/tap_stack.py" ]; then
        stack_file="lib/tap_stack.py"
    fi
    
    if [ -z "$stack_file" ] || [ ! -f "$stack_file" ]; then
        log_warning "Stack file not found"
        return
    fi
    
    local missing_practices=0
    
    # Check for encryption
    if ! grep -qi "encryption\|kms\|SSE\|encrypted" "$stack_file" 2>/dev/null; then
        log_warning "  No encryption configuration found"
        missing_practices=$((missing_practices + 1))
    else
        log_success "  Encryption configured"
    fi
    
    # Check for least privilege IAM
    if grep -qi "actions.*:\s*\[.*\*.*\]\|resources.*:\s*\[.*\*.*\]" "$stack_file" 2>/dev/null; then
        log_warning "  Overly permissive IAM policies detected (using *)"
        missing_practices=$((missing_practices + 1))
    else
        log_success "  IAM policies appear properly scoped"
    fi
    
    # Check for environment suffix
    if ! grep -qi "environmentSuffix\|environment_suffix" "$stack_file" 2>/dev/null; then
        log_warning "  environmentSuffix not found in resource names"
        missing_practices=$((missing_practices + 1))
    else
        log_success "  environmentSuffix used in resource names"
    fi
    
    # Check for logging/monitoring
    if ! grep -qi "logGroup\|CloudWatch\|log_group\|monitoring" "$stack_file" 2>/dev/null; then
        log_warning "  No logging/monitoring configuration found"
        missing_practices=$((missing_practices + 1))
    else
        log_success "  Logging/monitoring configured"
    fi
    
    if [ $missing_practices -gt 0 ]; then
        echo ""
        log_warning "Found $missing_practices missing security/best practices"
        log_info "Adding these could improve training quality score"
    fi
}

# Ensure PROMPT.md explicitly states platform requirements
check_prompt_clarity() {
    local prompt_file="lib/PROMPT.md"
    
    log_info "Checking PROMPT.md clarity..."
    
    if [ ! -f "$prompt_file" ]; then
        log_warning "PROMPT.md not found"
        return
    fi
    
    # Check if platform/language is explicitly stated
    if ! grep -qiE "using\s+(pulumi|cdk|terraform|cloudformation|cdktf)\s+with\s+(typescript|python|go|java)" "$prompt_file" 2>/dev/null; then
        log_warning "PROMPT.md should explicitly state platform and language"
        log_info "Example: 'Create infrastructure using **Pulumi with TypeScript**'"
    else
        log_success "PROMPT.md explicitly states platform/language"
    fi
    
    # Check for environmentSuffix requirement
    if ! grep -qi "environmentSuffix\|environment.suffix" "$prompt_file" 2>/dev/null; then
        log_warning "PROMPT.md should mention environmentSuffix requirement"
    else
        log_success "PROMPT.md mentions environmentSuffix"
    fi
}

# Update metadata with improved training quality
update_training_quality_metadata() {
    local new_score="$1"
    
    if [ ! -f "$METADATA_FILE" ]; then
        log_error "Metadata file not found: $METADATA_FILE"
        return 1
    fi
    
    log_info "Updating training_quality in metadata.json to $new_score"
    
    # Update the training_quality field
    jq --argjson score "$new_score" '.training_quality = $score' "$METADATA_FILE" > "${METADATA_FILE}.tmp"
    mv "${METADATA_FILE}.tmp" "$METADATA_FILE"
    
    log_success "Updated training_quality to $new_score"
}

# Main function
main() {
    echo "📈 Training Quality Enhancer"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    get_platform_info
    
    local current_score=$(get_current_score)
    
    echo "Current training quality: ${current_score}/10"
    echo "Target training quality:  ${TARGET_SCORE}/10"
    echo "Platform: $PLATFORM, Language: $LANGUAGE"
    echo ""
    
    if [ "$current_score" -ge "$TARGET_SCORE" ]; then
        log_success "Training quality already meets target: ${current_score}/10 >= ${TARGET_SCORE}/10"
        exit 0
    fi
    
    local score_gap=$((TARGET_SCORE - current_score))
    log_info "Need to improve score by $score_gap points"
    echo ""
    
    # Run enhancements
    echo "🔍 Analyzing documentation quality..."
    echo ""
    
    enhance_model_failures
    echo ""
    
    enhance_ideal_response
    echo ""
    
    check_security_practices
    echo ""
    
    check_prompt_clarity
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ $ENHANCEMENTS_APPLIED -gt 0 ]; then
        log_success "Applied $ENHANCEMENTS_APPLIED enhancement(s)"
        echo ""
        log_info "Next steps to improve training quality:"
        echo "  1. Review and complete MODEL_FAILURES.md with actual failures"
        echo "  2. Ensure IDEAL_RESPONSE.md contains corrected code"
        echo "  3. Add security features (encryption, IAM, logging)"
        echo "  4. Re-run code review to calculate new score"
    else
        log_info "No automatic enhancements applied"
        echo ""
        log_info "To improve training quality manually:"
        echo "  1. Add more detailed failure analysis to MODEL_FAILURES.md"
        echo "  2. Include code patterns showing bad vs good implementations"
        echo "  3. Add AWS best practices to the infrastructure code"
        echo "  4. Ensure comprehensive test coverage"
    fi
    
    echo ""
    log_info "Training quality enhancement complete"
    log_info "Re-run code reviewer to calculate updated score"
    
    exit 0
}

main "$@"

