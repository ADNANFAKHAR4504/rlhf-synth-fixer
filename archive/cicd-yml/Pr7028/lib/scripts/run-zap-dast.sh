#!/bin/bash
set -euo pipefail
# Purpose: Run ZAP DAST scans against API endpoints (OWASP API Top 10).
# Usage: run-zap-dast.sh <environment>

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment>" >&2
  exit 1
fi

ENVIRONMENT="$1"

echo "[run-zap-dast] Running ZAP DAST for env='${ENVIRONMENT}'"
# TODO: zap-baseline.py / zap-full-scan.py with authenticated context.
