#!/bin/bash
set -e

# Send deployment notification
# Usage: ./lib/send-notification.sh <environment> <ref>

ENVIRONMENT=$1
REF=$2
WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

if [ -z "$ENVIRONMENT" ] || [ -z "$REF" ]; then
  echo "Usage: $0 <environment> <ref>"
  exit 1
fi

if [ -n "$WEBHOOK_URL" ]; then
  ENV_CAPITALIZED=$(echo "$ENVIRONMENT" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
  curl -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"${ENV_CAPITALIZED} deployment completed for ${REF}\"}"
else
  echo "SLACK_WEBHOOK_URL not set, skipping notification"
fi

