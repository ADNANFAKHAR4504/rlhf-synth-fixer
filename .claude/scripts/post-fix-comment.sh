#!/bin/bash
# Post fix documentation comment to PR with deduplication
set -e

PR_NUMBER="$1"
FIX_DESCRIPTION="$2"
FIX_REASON="$3"
FIX_IMPACT="$4"
FILES_MODIFIED="$5"
VALIDATION_STATUS="$6"

if [ -z "$PR_NUMBER" ] || [ -z "$FIX_DESCRIPTION" ]; then
  echo "Usage: $0 <pr_number> <fix_description> <fix_reason> <fix_impact> <files_modified> <validation_status>"
  exit 1
fi

# Sanitize description for single line (for deduplication check)
FIX_DESCRIPTION_CLEAN=$(echo "${FIX_DESCRIPTION}" | tr '\n' ' ' | head -c 100)

# Check if similar comment already exists (prevent duplicates)
echo "Checking for duplicate comments..."
EXISTING_COMMENT=$(gh pr view ${PR_NUMBER} --json comments --jq ".comments[] | select(.body | contains(\"${FIX_DESCRIPTION_CLEAN}\")) | .id" 2>/dev/null || echo "")

if [ -n "$EXISTING_COMMENT" ]; then
  echo "ℹ️ Similar fix comment already exists (ID: ${EXISTING_COMMENT}), skipping duplicate"
  exit 0
fi

# Create detailed fix comment
BRANCH_NAME=$(git branch --show-current)

COMMENT_BODY="## 🔧 Automated Fix Applied

**Issue Identified**: ${FIX_DESCRIPTION}

**Root Cause**: ${FIX_REASON}

**Fix Applied**: ${FIX_IMPACT}

**Files Modified**:
\`\`\`
${FILES_MODIFIED}
\`\`\`

**Validation Status**:
${VALIDATION_STATUS}

**Next Steps**:
- Pushed to branch: ${BRANCH_NAME}
- CI/CD will automatically re-run
- Monitoring for job completion

---
🤖 Automated by iac-synth-trainer | $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Post comment with retry
if bash .claude/scripts/retry-operation.sh "gh pr comment ${PR_NUMBER} --body '${COMMENT_BODY}'" 3 5; then
  echo "✅ Posted fix documentation to PR #${PR_NUMBER}"
else
  echo "⚠️ Failed to post comment (non-critical)"
  # Don't fail workflow if comment posting fails
fi
