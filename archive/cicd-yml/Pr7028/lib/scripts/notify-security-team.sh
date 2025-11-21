#!/bin/bash
set -euo pipefail
# Purpose: Notify security team via Pub/Sub about deployment status.
# Usage: notify-security-team.sh <topic> <environment> <build_id> <status>

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <topic> <environment> <build_id> <status>" >&2
  exit 1
fi

TOPIC="$1"
ENVIRONMENT="$2"
BUILD_ID="$3"
STATUS="$4"

echo "[notify-security-team] Notifying security team: topic='${TOPIC}', env='${ENVIRONMENT}', build='${BUILD_ID}', status='${STATUS}'"
# TODO: gcloud pubsub topics publish "${TOPIC}" --message="{...}" with redacted, non-PHI content.
