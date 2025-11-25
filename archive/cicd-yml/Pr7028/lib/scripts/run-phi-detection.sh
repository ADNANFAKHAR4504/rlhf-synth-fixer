#!/bin/bash
set -euo pipefail
# Purpose: Run PHI detection on logs/outputs to ensure no unredacted PHI.
# Usage: run-phi-detection.sh <environment> <siem_project_id>

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <environment> <siem_project_id>" >&2
  exit 1
fi

ENVIRONMENT="$1"
SIEM_PROJECT_ID="$2"

echo "[run-phi-detection] Running PHI detection for env='${ENVIRONMENT}', siem_project='${SIEM_PROJECT_ID}'"
# TODO: call Presidio scanners on relevant log or output locations.
