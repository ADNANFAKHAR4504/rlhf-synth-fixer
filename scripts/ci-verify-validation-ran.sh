#!/bin/bash
# Verify Claude ran the validation script
# Required env vars: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER
set -e

echo "🔍 Verifying Claude executed mandatory validation checks in most recent review..."

# Validate required environment variables
if [ -z "$GITHUB_REPOSITORY" ] || [ -z "$PR_NUMBER" ]; then
  echo "::error::Missing required environment variables GITHUB_REPOSITORY or PR_NUMBER"
  exit 1
fi

# Use the cached Claude review comment from previous steps
COMMENT_FILE=""
if [ -f "claude_review.txt" ] && [ -s "claude_review.txt" ]; then
  COMMENT_FILE="claude_review.txt"
elif [ -f "latest_claude_comment.txt" ] && [ -s "latest_claude_comment.txt" ]; then
  COMMENT_FILE="latest_claude_comment.txt"
fi

if [ -z "$COMMENT_FILE" ]; then
  echo "⚠️ No cached Claude comment found, fetching from API..."
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    --jq 'sort_by(.created_at) | reverse | .[0].body // empty' > latest_comment.txt
  COMMENT_FILE="latest_comment.txt"
fi

# Check for evidence of validation script execution in the most recent Claude comment
VALIDATION_EVIDENCE=false

if grep -q "validate-metadata.sh" "$COMMENT_FILE" || \
   grep -q "Metadata validation PASSED" "$COMMENT_FILE" || \
   grep -q "Metadata validation FAILED" "$COMMENT_FILE" || \
   grep -q "Validating metadata.json" "$COMMENT_FILE"; then
  echo "✅ Evidence found that Claude ran metadata validation"
  VALIDATION_EVIDENCE=true
fi

if [ "$VALIDATION_EVIDENCE" = false ]; then
  echo "⚠️ WARNING: No clear evidence Claude ran metadata validation script"
  echo "⚠️ Review comment may be incomplete or validation was skipped"
  echo ""
  echo "Expected to find one of:"
  echo "  - 'validate-metadata.sh' command execution"
  echo "  - 'Metadata validation PASSED' or 'FAILED'"
  echo "  - 'Validating metadata.json' output"
  echo ""
  echo "This is a warning only - review will continue based on score."
  echo "However, please verify the review is complete by checking PR comments."
else
  echo "✅ Validation script execution confirmed"
fi

