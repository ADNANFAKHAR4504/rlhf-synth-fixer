#!/bin/bash
set -euo pipefail
# Purpose: Deploy HIPAA-compliant Dataproc cluster (no public IPs, VPC-SC, CMEK).
# Usage: deploy-dataproc-hipaa.sh <region> <environment>

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <region> <environment>" >&2
  exit 1
fi

REGION="$1"
ENVIRONMENT="$2"

echo "[deploy-dataproc-hipaa] Deploying Dataproc cluster in region='${REGION}', env='${ENVIRONMENT}'"
# TODO: gcloud dataproc clusters create ... with proper flags.
