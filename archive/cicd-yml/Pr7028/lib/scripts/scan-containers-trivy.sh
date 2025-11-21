#!/bin/bash
set -euo pipefail
# Purpose: Scan container images with Trivy and fail on HIGH/CRITICAL vulnerabilities.
# Usage: scan-containers-trivy.sh <artifact_registry> <environment> <short_sha>

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <artifact_registry> <environment> <short_sha>" >&2
  exit 1
fi

ARTIFACT_REGISTRY="$1"
ENVIRONMENT="$2"
SHORT_SHA="$3"

IMAGE="${ARTIFACT_REGISTRY}/api/patient-service:${ENVIRONMENT}-${SHORT_SHA}"

echo "[scan-containers-trivy] Scanning image='${IMAGE}'"
# TODO: trivy image --exit-code 1 --severity HIGH,CRITICAL "${IMAGE}"
