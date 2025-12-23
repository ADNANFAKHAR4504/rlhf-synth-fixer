#!/bin/bash
set -euo pipefail
# Purpose: Configure data access audit controls (Data Catalog tags, DLP, BQ audit logs).
# Usage: data-access-audit-config.sh <bigquery_dataset> <environment>

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <bigquery_dataset> <environment>" >&2
  exit 1
fi

BIGQUERY_DATASET="$1"
ENVIRONMENT="$2"

echo "[data-access-audit-config] Configuring data access audit for dataset='${BIGQUERY_DATASET}', env='${ENVIRONMENT}'"
# TODO: gcloud data-catalog policy-tags, DLP jobs, BQ audit log configs.
