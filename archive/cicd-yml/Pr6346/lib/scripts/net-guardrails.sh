#!/usr/bin/env bash
set -euo pipefail

echo "[net-guardrails] Logging in with Azure federated identity..."
az login --service-principal \
  --tenant "$AZURE_TENANT_ID" \
  --username "$AZURE_CLIENT_ID" \
  --federated-token "$CI_JOB_JWT_V2" >/dev/null
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

mkdir -p "$SECURITY_DIR"
echo "Validate NSG/DDOS posture (assumed pre-provisioned)" > "${SECURITY_DIR}/network.txt"
cat "${SECURITY_DIR}/network.txt"

echo "[net-guardrails] Network guardrails stub complete."
