#!/bin/bash
# Wait for CI/CD to process changes with timeout
set -e

PR_NUMBER="$1"
MAX_WAIT="${2:-600}"  # Default 10 minutes

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr_number> [max_wait_seconds]"
  exit 1
fi

echo "⏳ Waiting for CI/CD to register changes..."
sleep 30  # Let GitHub process push and start workflows

echo "Polling CI/CD status (max ${MAX_WAIT}s)..."
WAIT_TIME=0
CICD_PROCESSING=true

while [ $WAIT_TIME -lt $MAX_WAIT ] && [ "$CICD_PROCESSING" == "true" ]; do
  # Check CI/CD status
  if bash .claude/scripts/cicd-job-checker.sh ${PR_NUMBER} > /dev/null 2>&1; then
    # Parse status
    IN_PROGRESS=$(jq -r '.in_progress // 0' cicd_summary.json)
    PENDING=$(jq -r '.pending // 0' cicd_summary.json)

    # Check for queued state (GitHub Actions specific)
    QUEUED=$(gh pr checks ${PR_NUMBER} --json state --jq '[.[] | select(.state == "queued")] | length' 2>/dev/null || echo "0")

    if [ "$IN_PROGRESS" -eq 0 ] && [ "$PENDING" -eq 0 ] && [ "$QUEUED" -eq 0 ]; then
      CICD_PROCESSING=false
      echo "✅ CI/CD processing complete (${WAIT_TIME}s elapsed)"
    else
      echo "⏳ CI/CD still processing... In Progress: ${IN_PROGRESS}, Pending: ${PENDING}, Queued: ${QUEUED} (${WAIT_TIME}s elapsed)"
      sleep 30
      WAIT_TIME=$((WAIT_TIME + 30))
    fi
  else
    echo "⚠️ Could not fetch CI/CD status, retrying..."
    sleep 30
    WAIT_TIME=$((WAIT_TIME + 30))
  fi
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
  echo "⏰ CI/CD timeout after ${MAX_WAIT}s - continuing anyway"
  echo "Note: CI/CD may still be processing. Next iteration will check again."
  exit 0
fi

echo "✅ CI/CD ready for status check"
