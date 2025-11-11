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
    echo "Environment: ${ENVIRONMENT_SUFFIX:-dev}"
    echo "Region: ${AWS_REGION:-us-east-1}"
    echo ""
    
    # Execute optimization script
    python3 lib/optimize.py
    
    echo ""
    echo "✅ IaC Optimization completed successfully"
else
    echo "IaC Optimization subtask not selected, skipping..."
    exit 0
fi

