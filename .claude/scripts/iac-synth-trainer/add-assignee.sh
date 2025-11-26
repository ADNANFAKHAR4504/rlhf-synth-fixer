#!/bin/bash
# Add current GitHub user as assignee to PR
set -e

PR_NUMBER="$1"

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr_number>"
  exit 1
fi

# Get current GitHub user with retry
GITHUB_USER=$(bash .claude/scripts/retry-operation.sh "gh api user --jq '.login'" 3 2 || echo "")

if [ -z "$GITHUB_USER" ]; then
  echo "ERROR: Failed to get GitHub user"
  exit 1
fi

echo "Current GitHub user: ${GITHUB_USER}"

# Add as assignee to PR with retry
if bash .claude/scripts/retry-operation.sh "gh pr edit ${PR_NUMBER} --add-assignee ${GITHUB_USER}" 3 2; then
  echo "✅ Added ${GITHUB_USER} as assignee to PR #${PR_NUMBER}"
  exit 0
else
  echo "⚠️ Failed to add assignee (non-critical)"
  exit 0  # Don't fail the workflow for this
fi
