#!/bin/bash
set -e

# IaC Optimization Script
# Checks if IaC Optimization subtask is selected and runs lib/optimize.py

echo "=================================================="
echo "IaC Optimization Check and Execution"
echo "=================================================="

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
    echo "metadata.json not found, skipping optimization step"
    exit 0
fi

# Check if IaC Optimization is in subject_labels
SUBJECT_LABELS=$(jq -r '.subject_labels[]? // empty' metadata.json)

if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
    echo "✓ IaC Optimization subtask detected"

    # Check if lib/optimize.py exists
    if [ ! -f "lib/optimize.py" ]; then
        echo "❌ Error: lib/optimize.py not found but subtask is IaC Optimization"
        exit 1
    fi

    echo "✓ Found lib/optimize.py"

    # Detect provider from metadata.json
    PROVIDER=$(jq -r '.provider // "aws"' metadata.json)
    echo "Provider: $PROVIDER"
    echo "Environment: ${ENVIRONMENT_SUFFIX:-dev}"
    echo "Region: ${AWS_REGION:-us-east-1}"
    echo ""

    # Configure LocalStack environment if needed
    if [ "$PROVIDER" = "localstack" ]; then
        echo "🔧 Configuring LocalStack environment..."
        export AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
        echo "LocalStack endpoint: $AWS_ENDPOINT_URL"
    fi

    # Execute optimization script
    python3 lib/optimize.py

    echo ""
    echo "✅ IaC Optimization completed successfully"
else
    echo "IaC Optimization subtask not selected, skipping..."
    exit 0
fi

