#!/bin/bash
set -euo pipefail

echo "Validating Bicep templates..."

# Find all Bicep files
BICEP_FILES=$(find infrastructure/bicep -name "*.bicep")

for file in $BICEP_FILES; do
    echo "Validating: $file"
    az bicep build --file "$file" --stdout > /dev/null
    
    # Lint the Bicep file
    az bicep lint --file "$file"
    
    if [ $? -ne 0 ]; then
        echo "Validation failed for $file"
        exit 1
    fi
done

echo "All Bicep templates validated successfully"