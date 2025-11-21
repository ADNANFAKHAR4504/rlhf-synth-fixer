#!/bin/bash
set -euo pipefail
# Purpose: Run Prowler with HIPAA-related checks against the target environment.
# Usage: run-prowler-hipaa.sh <environment>

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment>" >&2
  exit 1
fi

ENVIRONMENT="$1"

echo "[run-prowler-hipaa] Running Prowler HIPAA checks for env='${ENVIRONMENT}'"
# TODO: prowler -g hipaa
