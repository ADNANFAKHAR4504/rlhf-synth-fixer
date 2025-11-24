#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"
RESOURCE_GROUP="${2:-}"
LOCATION="${3:-}"

if [[ -z "${RESOURCE_GROUP}" || -z "${LOCATION}" ]]; then
  echo "Usage: deploy-bicep.sh <env> <resource-group> <location>"
  exit 1
fi

echo "[deploy-bicep] Deploying Bicep templates for env=${ENVIRONMENT}, rg=${RESOURCE_GROUP}, location=${LOCATION}"

MAIN_TEMPLATE="infra/bicep/main.bicep"

az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}"

az deployment group create   --resource-group "${RESOURCE_GROUP}"   --template-file "${MAIN_TEMPLATE}"   --parameters environment="${ENVIRONMENT}" location="${LOCATION}"   --query "properties.outputs" -o table
