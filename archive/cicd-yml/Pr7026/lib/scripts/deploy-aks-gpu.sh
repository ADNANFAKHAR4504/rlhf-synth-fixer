#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"
AKS_NAME="${2:-}"

if [[ -z "${AKS_NAME}" ]]; then
  echo "Usage: deploy-aks-gpu.sh <env> <aks-name>"
  exit 1
fi

echo "[deploy-aks-gpu] Deploying GPU workloads to AKS cluster ${AKS_NAME} for env=${ENVIRONMENT}"

# Set AKS context (resource group assumed by convention)
RG_VAR="DEV_RESOURCE_GROUP"
[[ "${ENVIRONMENT}" == "staging" ]] && RG_VAR="STAGING_RESOURCE_GROUP"
[[ "${ENVIRONMENT}" == "prod" ]] && RG_VAR="PROD_RESOURCE_GROUP"

RESOURCE_GROUP="${!RG_VAR}"

az aks get-credentials --resource-group "${RESOURCE_GROUP}" --name "${AKS_NAME}" --overwrite-existing

helm upgrade --install transcoding-worker charts/transcoding-worker   --namespace media   --create-namespace   --set image.repository="${ACR_NAME}.azurecr.io/transcoding-worker"   --set image.tag="${GITHUB_SHA}"   --set nodeSelector."beta\.kubernetes\.io/accelerator"=nvidia-tesla-t4   --set tolerations[0].key="sku"   --set tolerations[0].operator="Equal"   --set tolerations[0].value="gpu"   --set resources.limits."nvidia\.com/gpu"=1
