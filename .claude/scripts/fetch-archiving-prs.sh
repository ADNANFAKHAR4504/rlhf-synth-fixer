#!/bin/bash
# Fetch PRs in archiving status (all CI/CD checks passed)
# Simplified, focused script - outputs only necessary data
#
# Usage: ./fetch-archiving-prs.sh [assignee]
# Output: JSON array of archiving-ready PRs

set -euo pipefail

ASSIGNEE="${1:-mayanksethi-turing}"

echo "Fetching archiving-ready PRs for: $ASSIGNEE" >&2

# Validate gh CLI is authenticated
if ! gh auth status &>/dev/null; then
  echo '{"error": "GitHub CLI not authenticated. Run: gh auth login"}' 
  exit 1
fi

# Get all OPEN PRs and filter for archiving status
# Archiving status = ALL checks passed (no failures, no pending)
gh pr list \
  --author "$ASSIGNEE" \
  --state open \
  --limit 200 \
  --json number,url,headRefName,title,statusCheckRollup 2>/dev/null | jq -c '
  [.[] | 
    # Check if all status checks have passed
    select(
      .statusCheckRollup != null and
      (.statusCheckRollup | length) > 0 and
      (.statusCheckRollup | all(
        .conclusion == "SUCCESS" or 
        .conclusion == "success" or 
        .conclusion == "SKIPPED" or 
        .conclusion == "skipped"
      ))
    ) | 
    {
      pr_number: .number,
      pr_url: .url,
      branch: .headRefName,
      title: .title
    }
  ]
'

