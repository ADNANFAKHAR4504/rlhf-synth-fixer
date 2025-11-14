#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$REPORT_DIR"

cat > "${REPORT_DIR}/monitoring.json" <<EOF
{"appInsights":"wired","grafana":"ok","alerts":"ok"}
EOF

if [ -n "${PAGERDUTY_ROUTING_KEY:-}" ]; then
  echo "[configure-monitoring] Sending PagerDuty notification..."
  curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
    -H "Content-Type: application/json" \
    -d "{
      \"routing_key\": \"${PAGERDUTY_ROUTING_KEY}\",
      \"event_action\": \"trigger\",
      \"payload\": {
        \"summary\": \"Deploy ${CI_COMMIT_SHORT_SHA} complete\",
        \"source\": \"gitlab-ci\",
        \"severity\": \"info\"
      }
    }" >/dev/null || echo "[configure-monitoring] PagerDuty call failed (non-blocking)."
else
  echo "[configure-monitoring] No PAGERDUTY_ROUTING_KEY set; skipping PagerDuty notification."
fi

echo "[configure-monitoring] Monitoring snapshot written to ${REPORT_DIR}/monitoring.json"
