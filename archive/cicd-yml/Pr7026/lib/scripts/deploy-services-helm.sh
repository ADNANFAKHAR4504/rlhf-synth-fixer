#!/usr/bin/env bash
# scripts/deploy-services-helm.sh
set -euo pipefail

ENVIRONMENT="${1:-dev}"
NAMESPACE="${2:-media-${ENVIRONMENT}}"
CHARTS_ROOT="${CHARTS_ROOT:-charts}"

echo "[deploy-services-helm] Starting Helm deploy for env='${ENVIRONMENT}', namespace='${NAMESPACE}'"

# ----- Basic validation -----
if ! command -v helm >/dev/null 2>&1; then
  echo "[deploy-services-helm] ERROR: helm is not installed or not in PATH"
  exit 1
fi

echo "[deploy-services-helm] Using Helm: $(helm version --short || echo 'unknown version')"

if [[ -z "${ACR_NAME:-}" ]]; then
  echo "[deploy-services-helm] ERROR: ACR_NAME environment variable is required"
  exit 1
fi

if [[ -z "${GITHUB_SHA:-}" ]]; then
  echo "[deploy-services-helm] ERROR: GITHUB_SHA environment variable is required"
  exit 1
fi

# Verify charts exist
if [[ ! -d "${CHARTS_ROOT}/upload-api" ]]; then
  echo "[deploy-services-helm] ERROR: Chart directory not found: ${CHARTS_ROOT}/upload-api"
  exit 1
fi

if [[ ! -d "${CHARTS_ROOT}/streaming-api" ]]; then
  echo "[deploy-services-helm] ERROR: Chart directory not found: ${CHARTS_ROOT}/streaming-api"
  exit 1
fi

# Optional: allow DRY_RUN=true for debug
DRY_RUN="${DRY_RUN:-false}"
HELM_EXTRA_FLAGS=()
if [[ "${DRY_RUN}" == "true" ]]; then
  echo "[deploy-services-helm] DRY_RUN mode enabled (no actual changes will be applied)"
  HELM_EXTRA_FLAGS+=(--dry-run --debug)
fi

# Helper to run Helm with nice errors
run_helm_upgrade() {
  local release="$1"
  local chart_path="$2"
  local image_repo="$3"
  local image_tag="$4"

  echo "[deploy-services-helm] Deploying release='${release}' chart='${chart_path}'"

  if ! helm upgrade --install "${release}" "${chart_path}" \
    --namespace "${NAMESPACE}" \
    --create-namespace \
    --set image.repository="${image_repo}" \
    --set image.tag="${image_tag}" \
    --wait \
    --timeout 5m \
    "${HELM_EXTRA_FLAGS[@]}"
  then
    echo "[deploy-services-helm] ERROR: Helm upgrade failed for release='${release}'"
    exit 1
  fi

  echo "[deploy-services-helm] Successfully deployed release='${release}'"
}

UPLOAD_REPO="${ACR_NAME}.azurecr.io/upload-api"
STREAMING_REPO="${ACR_NAME}.azurecr.io/streaming-api"

# Deploy upload-api
run_helm_upgrade \
  "upload-api" \
  "${CHARTS_ROOT}/upload-api" \
  "${UPLOAD_REPO}" \
  "${GITHUB_SHA}"

# Deploy streaming-api
run_helm_upgrade \
  "streaming-api" \
  "${CHARTS_ROOT}/streaming-api" \
  "${STREAMING_REPO}" \
  "${GITHUB_SHA}"

echo "[deploy-services-helm] All services successfully deployed for env='${ENVIRONMENT}' namespace='${NAMESPACE}'"
