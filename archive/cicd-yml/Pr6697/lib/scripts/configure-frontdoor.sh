#!/bin/bash
set -euo pipefail

ENVIRONMENT=$1

echo "Configuring Azure Front Door for $ENVIRONMENT..."

# Configure backend pools
az network front-door backend-pool update \
    --resource-group "$frontDoorResourceGroup" \
    --front-door-name "$frontDoorName" \
    --name "backend-pool-$ENVIRONMENT" \
    --backends \
        address="aks-eastus.$ENVIRONMENT.retailplatform.com" weight=25 priority=1 enabled=true \
        address="aks-westeu.$ENVIRONMENT.retailplatform.com" weight=25 priority=1 enabled=true \
        address="aks-sea.$ENVIRONMENT.retailplatform.com" weight=25 priority=2 enabled=true \
        address="aks-aus.$ENVIRONMENT.retailplatform.com" weight=25 priority=2 enabled=true

# Configure health probes
az network front-door probe update \
    --resource-group "$frontDoorResourceGroup" \
    --front-door-name "$frontDoorName" \
    --name "health-probe-$ENVIRONMENT" \
    --path "/health" \
    --protocol Https \
    --interval 30

# Configure load balancing
az network front-door load-balancing update \
    --resource-group "$frontDoorResourceGroup" \
    --front-door-name "$frontDoorName" \
    --name "load-balancing-$ENVIRONMENT" \
    --sample-size 4 \
    --successful-samples-required 2 \
    --additional-latency-ms 50

# Configure WAF policy
az network front-door waf-policy update \
    --resource-group "$frontDoorResourceGroup" \
    --name "waf-$ENVIRONMENT" \
    --mode Prevention \
    --enable-state Enabled

# Configure caching rules
az network front-door routing-rule update \
    --resource-group "$frontDoorResourceGroup" \
    --front-door-name "$frontDoorName" \
    --name "routing-rule-$ENVIRONMENT" \
    --caching Enabled \
    --cache-duration "P1D"

echo "Front Door configuration completed"