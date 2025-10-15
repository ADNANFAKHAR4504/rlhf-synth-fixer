#!/bin/bash

STACK_NAME="TapStacksynth3039452700"
REGION="eu-central-1"
MAX_WAIT=60  # 30 minutes (60 * 30 seconds)

for i in $(seq 1 $MAX_WAIT); do
    STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION 2>&1 | jq -r '.Stacks[0].StackStatus')

    echo "[$(date '+%H:%M:%S')] Stack status: $STATUS"

    if [ "$STATUS" = "CREATE_COMPLETE" ]; then
        echo "SUCCESS: Stack created successfully!"
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "ROLLBACK_COMPLETE" ] || [ "$STATUS" = "ROLLBACK_IN_PROGRESS" ]; then
        echo "FAILED: Stack creation failed!"
        echo "Fetching failure reasons..."
        aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $REGION --max-items 20 | jq -r '.StackEvents[] | select(.ResourceStatus | contains("FAILED")) | "\(.ResourceType): \(.ResourceStatusReason // "Unknown")"' | head -10
        exit 1
    fi

    sleep 30
done

echo "TIMEOUT: Stack creation did not complete in 30 minutes"
exit 1
