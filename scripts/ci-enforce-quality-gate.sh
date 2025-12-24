#!/bin/bash
# Enforce quality threshold for Claude review
# Required env vars: QUALITY_SCORE
# Optional env vars: GITHUB_REPOSITORY, PR_NUMBER (for LocalStack detection)
set -e

echo "🔍 Evaluating Claude quality gate..."

# Validate required environment variable
if [ -z "$QUALITY_SCORE" ]; then
  echo "::error::Missing required environment variable QUALITY_SCORE"
  exit 1
fi

# Default threshold
THRESHOLD=8

# ============================================================
# LOCALSTACK MIGRATION DETECTION
# LocalStack PRs use a lower quality threshold (6 instead of 8)
# because LocalStack doesn't support all AWS features
# ============================================================

IS_LOCALSTACK_MIGRATION=false

# Try to detect LocalStack migration from branch name
if [ -n "$GITHUB_REPOSITORY" ] && [ -n "$PR_NUMBER" ]; then
  BRANCH_NAME=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" \
    --jq '.head.ref // empty' 2>/dev/null || echo "")
  
  if [[ "$BRANCH_NAME" == ls-* ]] || [[ "$BRANCH_NAME" == *localstack* ]] || [[ "$BRANCH_NAME" == *LS-* ]]; then
    IS_LOCALSTACK_MIGRATION=true
    THRESHOLD=6  # Lower threshold for LocalStack migrations
    echo "🔧 LocalStack migration detected - using adjusted threshold ($THRESHOLD)"
  fi
fi

# Also check via environment variable if set by previous steps
if [ "$LOCALSTACK_MIGRATION" = "true" ]; then
  IS_LOCALSTACK_MIGRATION=true
  THRESHOLD=6
  echo "🔧 LocalStack migration (from env) - using adjusted threshold ($THRESHOLD)"
fi

if (( QUALITY_SCORE < THRESHOLD )); then
  if [ "$IS_LOCALSTACK_MIGRATION" = true ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "❌ LocalStack Migration Quality Gate Failed"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Score: $QUALITY_SCORE (threshold: $THRESHOLD)"
    echo ""
    echo "Even with adjusted LocalStack criteria, the score is too low."
    echo "Please check:"
    echo "  1. Is MODEL_FAILURES.md documenting LocalStack compatibility?"
    echo "  2. Are there actual code quality issues beyond LocalStack adaptations?"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
  else
    echo "❌ Quality score ($QUALITY_SCORE) below threshold ($THRESHOLD)."
  fi
  exit 1
else
  if [ "$IS_LOCALSTACK_MIGRATION" = true ]; then
    echo "✅ LocalStack migration quality score ($QUALITY_SCORE) meets adjusted threshold ($THRESHOLD)."
  else
    echo "✅ Quality score ($QUALITY_SCORE) meets or exceeds threshold ($THRESHOLD)."
  fi
fi

