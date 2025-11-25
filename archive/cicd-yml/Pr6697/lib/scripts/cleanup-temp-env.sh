#!/bin/bash
set -euo pipefail

if [ -f .temp-env-name ]; then
    TEMP_ENV_NAME=$(cat .temp-env-name)
    RESOURCE_GROUP="rg-$TEMP_ENV_NAME"
    
    echo "Cleaning up temporary environment: $TEMP_ENV_NAME"
    
    # Delete resource group
    az group delete --name "$RESOURCE_GROUP" --yes --no-wait
    
    # Clean up local files
    rm -f .temp-env-name test-config.json
    
    echo "Cleanup initiated for $TEMP_ENV_NAME"
else
    echo "No temporary environment to clean up"
fi