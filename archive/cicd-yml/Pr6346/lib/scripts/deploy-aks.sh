#!/usr/bin/env bash
set -euo pipefail

echo "[deploy-aks] Logging in with Azure federated identity..."
az login --service-principal \
  --tenant "$AZURE_TENANT_ID" \
  --username "$AZURE_CLIENT_ID" \
  --federated-token "$CI_JOB_JWT_V2" >/dev/null
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

RG="${RG_DEV_EASTUS}"
AKS="${AKS_DEV_EASTUS}"

echo "[deploy-aks] Getting credentials for AKS cluster $AKS in $RG..."
az aks get-credentials -g "$RG" -n "$AKS" --overwrite-existing

ZIP_PATH="${FUNCTIONS_OUT_DIR}/matchmaking.zip"
if [ -f "$ZIP_PATH" ]; then
  echo "[deploy-aks] Deploying Functions ZIP to dev-functions-app..."
  az functionapp deployment source config-zip \
    -g "$RG" \
    -n "dev-functions-app" \
    --src "$ZIP_PATH"
else
  echo "[deploy-aks] WARNING: Functions ZIP not found at $ZIP_PATH, skipping Functions deploy."
fi

echo "[deploy-aks] Deploying Helm chart for game server..."
helm upgrade --install game "${HELM_OUT_DIR}/game-server-*.tgz" \
  --set image.registry="${ACR_REGISTRY}.azurecr.io" \
  --set image.tag="${CI_COMMIT_SHA}"

echo "[deploy-aks] Writing dev release notes..."
echo "dev release OK (commit ${CI_COMMIT_SHA})" > "${HELM_OUT_DIR}/release-notes-dev.txt"
