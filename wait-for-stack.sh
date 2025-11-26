#!/bin/bash
set -e

MAX_WAIT=600  # 10 minutes max additional wait
INTERVAL=30   # Check every 30 seconds
elapsed=0

echo "Monitoring stack TapStacksynth101912655..."

while [ $elapsed -lt $MAX_WAIT ]; do
  STATUS=$(aws cloudformation describe-stacks \
    --stack-name TapStacksynth101912655 \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>&1)
  
  echo "[$elapsed seconds] Status: $STATUS"
  
  if [[ "$STATUS" == "CREATE_COMPLETE" ]]; then
    echo "✅ Stack deployment completed successfully!"
    exit 0
  elif [[ "$STATUS" == *"FAILED"* ]] || [[ "$STATUS" == *"ROLLBACK"* ]]; then
    echo "❌ Stack deployment failed with status: $STATUS"
    exit 1
  fi
  
  sleep $INTERVAL
  elapsed=$((elapsed + INTERVAL))
done

echo "⚠️ Timeout reached after ${MAX_WAIT} seconds"
exit 1
