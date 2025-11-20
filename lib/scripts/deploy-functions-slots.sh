#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"

echo "[deploy-functions-slots] Deploying Azure Functions for env=${ENVIRONMENT}"

FUNCTION_APP_NAME="media-functions-${ENVIRONMENT}"
PACKAGE_ROOT="${FUNCTIONS_DIR:-src/functions}/dist"

if [[ ! -d "${PACKAGE_ROOT}" ]]; then
  echo "[deploy-functions-slots] ERROR: Functions build directory not found at ${PACKAGE_ROOT}"
  echo "Make sure the build step ran and FUNCTIONS_DIR is set correctly."
  exit 1
fi

RG_VAR="DEV_RESOURCE_GROUP"
if [[ "${ENVIRONMENT}" == "staging" ]]; then
  RG_VAR="STAGING_RESOURCE_GROUP"
elif [[ "${ENVIRONMENT}" == "prod" || "${ENVIRONMENT}" == "production" ]]; then
  RG_VAR="PROD_RESOURCE_GROUP"
fi

if [[ -z "${!RG_VAR:-}" ]]; then
  echo "[deploy-functions-slots] ERROR: Environment variable ${RG_VAR} is not set."
  exit 1
fi

RESOURCE_GROUP="${!RG_VAR}"

ZIP_FILE="/tmp/functions-${ENVIRONMENT}.zip"
cd "${PACKAGE_ROOT}"
zip -r "${ZIP_FILE}" .

echo "[deploy-functions-slots] Deploying ${ZIP_FILE} to Function App: ${FUNCTION_APP_NAME} (RG: ${RESOURCE_GROUP})"

az functionapp deployment source config-zip \
  --name "${FUNCTION_APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --src "${ZIP_FILE}"
