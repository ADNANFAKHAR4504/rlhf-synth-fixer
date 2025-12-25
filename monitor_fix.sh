#!/bin/bash
RUN_ID="20500603027"
REPO="TuringGpt/iac-test-automations"

echo "Monitoring workflow run $RUN_ID..."
echo ""

for i in {1..20}; do
  STATUS=$(gh run view "$RUN_ID" --repo "$REPO" --json status --jq '.status')
  echo "[$i] Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo "Workflow completed!"
    break
  fi

  sleep 30
done

echo ""
echo "Final Status:"
gh run view "$RUN_ID" --repo "$REPO" --json status,conclusion,jobs | jq '{
  status: .status,
  conclusion: .conclusion,
  failed_jobs: [.jobs[] | select(.conclusion == "failure") | {name: .name, conclusion: .conclusion}],
  passed_count: [.jobs[] | select(.conclusion == "success")] | length
}'
