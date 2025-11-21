#!/bin/bash
set -euo pipefail
# Purpose: Sign container images using Cosign + Cloud KMS.
# Usage: sign-containers-hipaa.sh <artifact_registry> <kms_keyring> <environment> <short_sha>

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <artifact_registry> <kms_keyring> <environment> <short_sha>" >&2
  exit 1
fi

ARTIFACT_REGISTRY="$1"
KMS_KEYRING="$2"
ENVIRONMENT="$3"
SHORT_SHA="$4"

echo "[sign-containers-hipaa] Signing images for env='${ENVIRONMENT}', sha='${SHORT_SHA}', registry='${ARTIFACT_REGISTRY}', keyring='${KMS_KEYRING}'"
# TODO: cosign sign --key "gcpkms://projects/.../keyRings/${KMS_KEYRING}/..." "${ARTIFACT_REGISTRY}/api/patient-service:${ENVIRONMENT}-${SHORT_SHA}"
