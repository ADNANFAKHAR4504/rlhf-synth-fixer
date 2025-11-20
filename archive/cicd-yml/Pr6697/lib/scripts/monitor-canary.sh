#!/bin/bash
set -euo pipefail

ENVIRONMENT=$1
MIN_SUCCESS_RATE=$2
MAX_P95_LATENCY=$3

echo "Monitoring canary deployment in $ENVIRONMENT..."

# Monitor for 10 minutes
END_TIME=$(($(date +%s) + 600))

while [ $(date +%s) -lt $END_TIME ]; do
    # Query metrics from Application Insights
    SUCCESS_RATE=$(az monitor metrics list \
        --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-retail-$ENVIRONMENT/providers/Microsoft.Insights/components/ai-retail-$ENVIRONMENT" \
        --metric "requests/success" \
        --aggregation Average \
        --interval PT1M \
        --query "value[0].timeseries[0].data[0].average" \
        --output tsv)
    
    P95_LATENCY=$(az monitor metrics list \
        --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-retail-$ENVIRONMENT/providers/Microsoft.Insights/components/ai-retail-$ENVIRONMENT" \
        --metric "requests/duration" \
        --aggregation Percentile95 \
        --interval PT1M \
        --query "value[0].timeseries[0].data[0].percentile95" \
        --output tsv)
    
    echo "Current metrics: Success Rate=$SUCCESS_RATE%, P95 Latency=${P95_LATENCY}ms"
    
    # Check thresholds
    if (( $(echo "$SUCCESS_RATE < $MIN_SUCCESS_RATE" | bc -l) )); then
        echo "Success rate below threshold!"
        exit 1
    fi
    
    if (( $(echo "$P95_LATENCY > $MAX_P95_LATENCY" | bc -l) )); then
        echo "P95 latency above threshold!"
        exit 1
    fi
    
    sleep 30
done

echo "Canary monitoring completed successfully"