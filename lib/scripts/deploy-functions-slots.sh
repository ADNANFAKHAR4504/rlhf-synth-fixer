#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"

echo "[deploy-functions-slots] Deploying Azure Functions for env=${ENVIRONMENT}"

FUNCTION_APP_NAME="media-functions-${ENVIRONMENT}"
PACKAGE_PATH="${FUNCTIONS_DIR:-src/functions}/dist"

if [[ ! -d "${PACKAGE_PATH}" ]]; then
  echo "Functions build directory not found at ${PACKAGE_PATH}"
  exit 1
fi

ZIP_FILE="/tmp/functions-${ENVIRONMENT}.zip"
cd "${PACKAGE_PATH}"
zip -r "${ZIP_FILE}" .

az functionapp deployment source config-zip   --name "${FUNCTION_APP_NAME}"   --resource-group "${DEV_RESOURCE_GROUP}"   --src "${ZIP_FILE}"
