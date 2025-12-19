#!/bin/bash
set -euo pipefail
# Purpose: Configure Cloud Monitoring dashboards and alerting for HIPAA metrics.
# Usage: configure-monitoring.sh <environment> <security_project_id>

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <environment> <security_project_id>" >&2
  exit 1
fi

ENVIRONMENT="$1"
SECURITY_PROJECT_ID="$2"

echo "[configure-monitoring] Configuring monitoring for env='${ENVIRONMENT}', security_project='${SECURITY_PROJECT_ID}'"
# TODO: gcloud monitoring dashboards/alert-policies create or update.
