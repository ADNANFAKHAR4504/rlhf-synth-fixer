#!/usr/bin/env bash
set -euo pipefail

RG="${1:-$RG_DEV_EASTUS}"
APP_NAME="${2:-dev-functions-app}"
ZIP_PATH="${3:-${FUNCTIONS_OUT_DIR}/matchmaking.zip}"

echo "[deploy-functions] Using resource group: $RG"
echo "[deploy-functions] Using app name:      $APP_NAME"
echo "[deploy-functions] Using ZIP path:      $ZIP_PATH"

if [ ! -f "$ZIP_PATH" ]; then
  echo "[deploy-functions] ERROR: ZIP not found at $ZIP_PATH"
  exit 1
end
fi

az functionapp deployment source config-zip \
  -g "$RG" \
  -n "$APP_NAME" \
  --src "$ZIP_PATH"

echo "[deploy-functions] Deployment complete."
