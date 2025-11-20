# scripts/deploy-services-helm.sh
#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"

NAMESPACE="media"

echo "[deploy-services-helm] Deploying upload-api and streaming-api for env=${ENVIRONMENT}"

helm upgrade --install upload-api charts/upload-api \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --set image.repository="${ACR_NAME}.azurecr.io/upload-api" \
  --set image.tag="${GITHUB_SHA}"

helm upgrade --install streaming-api charts/streaming-api \
  --namespace "${NAMESPACE}" \
  --set image.repository="${ACR_NAME}.azurecr.io/streaming-api" \
  --set image.tag="${GITHUB_SHA}"
