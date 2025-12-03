#!/bin/bash
set -e

echo "📢 Sending notification..."

# Validate required environment variables
if [ -z "$STATUS" ]; then
  echo "Error: STATUS environment variable is not set"
  exit 1
fi

# Build notification message
MESSAGE="Pipeline ${STATUS}"
if [ -n "$ENVIRONMENT" ]; then
  MESSAGE="${MESSAGE} for ${ENVIRONMENT} environment"
fi

# Add color coding based on status
case "$STATUS" in
  success)
    COLOR="good"
    EMOJI="✅"
    ;;
  failure)
    COLOR="danger"
    EMOJI="❌"
    ;;
  warning)
    COLOR="warning"
    EMOJI="⚠️"
    ;;
  *)
    COLOR="warning"
    EMOJI="ℹ️"
    ;;
esac

echo "${EMOJI} ${MESSAGE}"

# Send Slack notification if webhook is configured
if [ -n "$SLACK_WEBHOOK" ]; then
  PAYLOAD=$(cat <<EOF
{
  "text": "${EMOJI} ${MESSAGE}",
  "attachments": [
    {
      "color": "${COLOR}",
      "fields": [
        {
          "title": "Status",
          "value": "${STATUS}",
          "short": true
        },
        {
          "title": "Environment",
          "value": "${ENVIRONMENT:-N/A}",
          "short": true
        },
        {
          "title": "Build URL",
          "value": "${GITHUB_RUN_URL:-N/A}",
          "short": false
        }
      ]
    }
  ]
}
EOF
)

  curl -X POST "${SLACK_WEBHOOK}" \
    -H 'Content-Type: application/json' \
    -d "${PAYLOAD}"

  echo "✅ Slack notification sent"
else
  echo "⚠️ SLACK_WEBHOOK not configured, skipping notification"
fi

echo "Notification complete"
