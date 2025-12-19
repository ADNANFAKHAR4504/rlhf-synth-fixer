#!/usr/bin/env bash
set -euo pipefail

echo "[deploy-canary-flagger] Logging in with Azure federated identity..."
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
)

for R in "${pairs[@]}"; do
  RG="${R%%:*}"
  AKS="${R##*:}"
  echo "[deploy-canary-flagger] Deploying canary to $AKS in $RG..."
  az aks get-credentials -g "$RG" -n "$AKS" --overwrite-existing
  helm upgrade --install game "${HELM_OUT_DIR}/game-server-*.tgz" \
    --set canary.enabled=true \
    --set image.registry="$IMG_REG" \
    --set image.tag="$TAG"
done

mkdir -p "$REPORT_DIR"
echo '{"progress":[10,25,50,100]}' > "${REPORT_DIR}/flagger.json"
echo "[deploy-canary-flagger] Canary rollout triggered; progress stub written."
