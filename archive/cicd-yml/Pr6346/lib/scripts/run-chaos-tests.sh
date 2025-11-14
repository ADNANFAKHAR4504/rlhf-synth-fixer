#!/usr/bin/env bash
set -euo pipefail

echo "[run-chaos-tests] Logging in with Azure federated identity..."
az login --service-principal \
  --tenant "$AZURE_TENANT_ID" \
  --username "$AZURE_CLIENT_ID" \
  --federated-token "$CI_JOB_JWT_V2" >/dev/null
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

RG="${RG_STG_EASTUS}"
AKS="${AKS_STG_EASTUS}"

echo "[run-chaos-tests] Getting credentials for AKS cluster $AKS in $RG..."
az aks get-credentials -g "$RG" -n "$AKS" --overwrite-existing

mkdir -p "$CHAOS_DIR"
kubectl get ns chaos-mesh || echo "[run-chaos-tests] Chaos Mesh namespace not found; assuming pre-provisioning handled."
kubectl get pod -n chaos-mesh > "${CHAOS_DIR}/pods.txt" || echo "[run-chaos-tests] Unable to list pods; check Chaos Mesh installation."

echo "[run-chaos-tests] Chaos Mesh snapshot written to ${CHAOS_DIR}/pods.txt"
