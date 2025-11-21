#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"
RESOURCE_GROUP="${2:-}"

if [[ -z "${RESOURCE_GROUP}" ]]; then
  echo "Usage: configure-monitoring.sh <env> <resource-group>"
  exit 1
fi

echo "[configure-monitoring] Configuring monitoring for env=${ENVIRONMENT}, rg=${RESOURCE_GROUP}"

echo "[configure-monitoring] Creating or updating Log Analytics workspace and App Insights"

WORKSPACE_NAME="la-${ENVIRONMENT}-media"
INSIGHTS_NAME="ai-${ENVIRONMENT}-media"

az monitor log-analytics workspace create   --resource-group "${RESOURCE_GROUP}"   --workspace-name "${WORKSPACE_NAME}"   --location "${LOCATION_PRIMARY:-eastus}"   --retention-time 30

az monitor app-insights component create   --app "${INSIGHTS_NAME}"   --location "${LOCATION_PRIMARY:-eastus}"   --resource-group "${RESOURCE_GROUP}"   --application-type web   --workspace "/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.OperationalInsights/workspaces/${WORKSPACE_NAME}" || true

echo "[configure-monitoring] Configure alerts, dashboards, and cost anomaly detection via Azure Monitor and Cost Management (placeholder)"
