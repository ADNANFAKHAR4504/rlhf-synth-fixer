#!/bin/bash
# Verify that Claude posted a review comment on the PR
# Required env vars: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, GITHUB_SERVER_URL, GITHUB_RUN_ID
set -e

echo "🔍 Verifying Claude posted a review comment..."

# Validate required environment variables
if [ -z "$GITHUB_REPOSITORY" ] || [ -z "$PR_NUMBER" ]; then
  echo "::error::Missing required environment variables GITHUB_REPOSITORY or PR_NUMBER"
  exit 1
fi

# Get the timestamp of when Claude action started (approximate)
CLAUDE_START_TIME=$(date -u -d '2 minutes ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-2M +%Y-%m-%dT%H:%M:%SZ)

# Fetch comments from the last few minutes
RECENT_COMMENTS=$(gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
  --jq ".[].body" 2>/dev/null || echo "")

# Check if any comment contains Claude review markers
if echo "$RECENT_COMMENTS" | grep -q "metadata.json Validation\|Code Review Summary\|Training Quality"; then
  echo "✅ Claude successfully posted a review comment"
  echo "comment_posted=true" >> "$GITHUB_OUTPUT"
else
  echo "⚠️ WARNING: Claude action completed but no review comment was found"
  echo "⚠️ This may be due to known issues with anthropics/claude-code-action@beta"
  echo "comment_posted=false" >> "$GITHUB_OUTPUT"
  
  # Post a fallback notification comment
  COMMENT_BODY="## ⚠️ Claude Review Job Completed With Issues

Status: The Claude review job ran but failed to post the review results.

Possible Causes:
- Known issue with anthropics/claude-code-action@beta (#548, #557, #567)
- GitHub API rate limiting
- Network connectivity issues

Action Required: Please check the GitHub Actions logs for the Claude review step.

Next Steps: The workflow will continue with quality gate validation using metadata.json as fallback.

Logs: ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}

---
Posted by CI/CD Pipeline | $(date -u +%Y-%m-%dT%H:%M:%SZ)"

  gh pr comment "$PR_NUMBER" --body "$COMMENT_BODY" || echo "⚠️ Failed to post fallback comment (non-blocking)"
fi

