#!/bin/bash
set -e

RUN_ID="20372291107"
MAX_WAIT=600
ELAPSED=0
INTERVAL=15

echo "Monitoring workflow run $RUN_ID..."
echo ""

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS=$(gh run view "$RUN_ID" --repo TuringGpt/iac-test-automations --json status,conclusion 2>/dev/null || echo '{}')
  STAT=$(echo "$STATUS" | jq -r '.status // "unknown"')
  CONCL=$(echo "$STATUS" | jq -r '.conclusion // "pending"')

  echo "[${ELAPSED}s] Status: $STAT, Conclusion: $CONCL"

  if [ "$STAT" = "completed" ]; then
    echo ""
    echo "Workflow completed with conclusion: $CONCL"
    exit 0
  fi

  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

echo ""
echo "Timeout reached after ${MAX_WAIT}s"
exit 1
