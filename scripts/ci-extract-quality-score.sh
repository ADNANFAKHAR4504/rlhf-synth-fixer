#!/bin/bash
# Extract Claude Quality Score from PR Comment
# Required env vars: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, GITHUB_OUTPUT
set -e

echo "🔍 Fetching most recent Claude review comment..."

# Validate required environment variables
if [ -z "$GITHUB_REPOSITORY" ] || [ -z "$PR_NUMBER" ]; then
  echo "::error::Missing required environment variables GITHUB_REPOSITORY or PR_NUMBER"
  exit 1
fi

# Use the latest Claude comment file if it exists from previous step
# Otherwise, fetch and find the most recent Claude review comment
if [ -f "latest_claude_comment.txt" ] && [ -s "latest_claude_comment.txt" ]; then
  echo "📝 Using cached latest Claude comment from previous step"
  cp latest_claude_comment.txt claude_review.txt
else
  echo "📝 Fetching Claude review comment from API..."
  # Find the most recent Claude review comment (contains review markers)
  CLAUDE_COMMENT=""
  while IFS= read -r -d '' comment || [[ -n "$comment" ]]; do
    if echo "$comment" | grep -qE "(metadata\.json Validation|Code Review Summary|Training Quality|SCORE:[0-9]+|## 📋)"; then
      CLAUDE_COMMENT="$comment"
      break
    fi
  done < <(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    --jq 'sort_by(.created_at) | reverse | .[] | .body + "\u0000"')
  
  if [ -z "$CLAUDE_COMMENT" ]; then
    echo "⚠️ No Claude review comment found, using most recent comment"
    CLAUDE_COMMENT=$(gh api \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
      --jq 'sort_by(.created_at) | reverse | .[0].body // empty')
  fi
  echo "$CLAUDE_COMMENT" > claude_review.txt
fi

echo "🍀 Searching for Claude quality score in review comment..."

# 1️⃣ STRICT: Look for exact SCORE:X format (required format)
# Must be SCORE: followed immediately by a number (no spaces)
SCORE=$(grep -Po 'SCORE:[0-9]+(\.[0-9]+)?' claude_review.txt | grep -Po '[0-9]+(\.[0-9]+)?' | tail -1 || echo "")

if [ -n "$SCORE" ]; then
  echo "✅ Found SCORE:$SCORE in strict format"
fi

# 2️⃣ FALLBACK: Check metadata.json training_quality (primary source)
if [ -z "$SCORE" ]; then
  echo "⚠️ SCORE:X format not found in comment. Checking metadata.json..."
  if [ -f "metadata.json" ]; then
    SCORE=$(jq -r '.training_quality // empty' metadata.json 2>/dev/null || echo "")
    if [ -n "$SCORE" ] && [[ "$SCORE" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
      echo "✅ Found training_quality in metadata.json: $SCORE"
    else
      echo "❌ metadata.json missing valid numeric training_quality"
      SCORE=""
    fi
  else
    echo "❌ metadata.json not found"
  fi
fi

# 3️⃣ FAIL if no score found from either source
if [ -z "$SCORE" ]; then
  echo "::error::No valid SCORE:X found in review comment and metadata.json missing training_quality"
  echo ""
  echo "❌ ERROR: Could not find any quality score"
  echo ""
  echo "Claude MUST either:"
  echo "  1. End the PR comment with SCORE:X (e.g., SCORE:8)"
  echo "  2. Update metadata.json with training_quality field"
  echo ""
  echo "Please check the PR comments to verify Claude completed the review properly."
  exit 1
fi

SCORE_INT=$(echo "$SCORE" | awk '{print int($1)}')

if (( $(echo "$SCORE_INT > 10" | bc -l) )); then
  echo "⚠️ Invalid high score ($SCORE) → set to 0"
  SCORE=0
elif (( $(echo "$SCORE_INT < 0" | bc -l) )); then
  echo "⚠️ Invalid negative score ($SCORE) → set to 0"
  SCORE=0
fi

echo "✅ Final Claude quality score: $SCORE"
echo "quality_score=$SCORE" >> "$GITHUB_OUTPUT"

