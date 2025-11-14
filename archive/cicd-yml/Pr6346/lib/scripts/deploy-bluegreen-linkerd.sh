#!/usr/bin/env bash
set -euo pipefail

echo "[deploy-bluegreen-linkerd] Logging in with Azure federated identity..."
az login --service-principal \
  --tenant "$AZURE_TENANT_ID" \
  --username "$AZURE_CLIENT_ID" \
  --federated-token "$CI_JOB_JWT_V2" >/dev/null
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

IMG_REG="${ACR_REGISTRY}.azurecr.io"
TAG="${CI_COMMIT_SHA}"

pairs=(
  "${RG_STG_EASTUS}:${AKS_STG_EASTUS}"
  "${RG_STG_WESTEU}:${AKS_STG_WESTEU}"
  "${RG_STG_SEASIA}:${AKS_STG_SEASIA}"
)

for R in "${pairs[@]}"; do
  RG="${R%%:*}"
  AKS="${R##*:}"
  echo "[deploy-bluegreen-linkerd] Deploying blue-green to $AKS in $RG..."
  az aks get-credentials -g "$RG" -n "$AKS" --overwrite-existing
  helm upgrade --install game "${HELM_OUT_DIR}/game-server-*.tgz" \
    --set blueGreen.enabled=true \
    --set image.registry="$IMG_REG" \
    --set image.tag="$TAG"
done

echo "[deploy-bluegreen-linkerd] Staging blue-green rollout complete."
echo "staging bg OK" > "${HELM_OUT_DIR}/release-notes-staging.txt"
