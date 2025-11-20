#!/bin/bash
set -euo pipefail

TEMP_ENV_NAME="temp-$(uuidgen | cut -d'-' -f1)"
RESOURCE_GROUP="rg-$TEMP_ENV_NAME"

echo "Deploying temporary environment: $TEMP_ENV_NAME"

# Create resource group
az group create --name "$RESOURCE_GROUP" --location eastus

# Deploy ARM template
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file infrastructure/arm/temp-environment.json \
    --parameters environmentName="$TEMP_ENV_NAME"

# Output connection strings for tests
az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name temp-environment \
    --query properties.outputs > test-config.json

echo "Temporary environment deployed: $TEMP_ENV_NAME"
echo "$TEMP_ENV_NAME" > .temp-env-name