#!/bin/bash
set -euo pipefail

IMAGE=$1

echo "Running Grype security scan on $IMAGE..."

# Install Grype if not present
if ! command -v grype &> /dev/null; then
    curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
fi

# Run Grype scan
grype "$IMAGE" \
    --fail-on critical \
    --output json \
    --file "grype-$BUILD_BUILDID.json"

# Parse results
HIGH_COUNT=$(jq '.matches | map(select(.vulnerability.severity == "High")) | length' "grype-$BUILD_BUILDID.json")
CRITICAL_COUNT=$(jq '.matches | map(select(.vulnerability.severity == "Critical")) | length' "grype-$BUILD_BUILDID.json")

echo "Grype scan results: Critical=$CRITICAL_COUNT, High=$HIGH_COUNT"

if [ "$CRITICAL_COUNT" -gt 0 ]; then
    echo "Critical vulnerabilities detected"
    exit 1
fi

echo "Grype scan completed successfully"