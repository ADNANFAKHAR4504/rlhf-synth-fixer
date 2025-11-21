#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
RESOURCE_GROUP="${2:-}"
AKS_BLUE="${3:-}"
AKS_GREEN="${4:-}"

if [[ -z "${RESOURCE_GROUP}" || -z "${AKS_BLUE}" || -z "${AKS_GREEN}" ]]; then
  echo "Usage: deploy-blue-green.sh <env> <resource-group> <aks-blue> <aks-green>"
  exit 1
fi

echo "[deploy-blue-green] Starting blue/green deployment for env=${ENVIRONMENT}"

# For simplicity we treat BLUE as current and GREEN as candidate
CURRENT="${AKS_BLUE}"
CANDIDATE="${AKS_GREEN}"

echo "[deploy-blue-green] Deploying candidate to ${CANDIDATE}"
az aks get-credentials --resource-group "${RESOURCE_GROUP}" --name "${CANDIDATE}" --overwrite-existing

helm upgrade --install upload-api charts/upload-api   --namespace media   --create-namespace   --set image.repository="${ACR_NAME}.azurecr.io/upload-api"   --set image.tag="${GITHUB_SHA}"

helm upgrade --install streaming-api charts/streaming-api   --namespace media   --set image.repository="${ACR_NAME}.azurecr.io/streaming-api"   --set image.tag="${GITHUB_SHA}"

echo "[deploy-blue-green] Update Traffic Manager or Front Door routing to shift traffic blue->green gradually (0->20->50->100)."
